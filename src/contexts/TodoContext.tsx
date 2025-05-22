import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useThrottledValue } from '@/hooks/useThrottledValue';
import { 
  parseMarkdownList, 
  flattenMarkdownList, 
  FlattenedTodo, 
  convertTodosToMarkdown,
  convertTodosToJira,
  convertTodosToHtml,
  TodoItemForExport
} from '@/util/markdown';
import { useTodoLists } from './TodoListsContext';
import { getTotalStats } from '@/util/todoStats';

export interface TimeEntry {
  startTime: number; // Timestamp in milliseconds
  endTime: number;   // Timestamp in milliseconds
  duration: number;  // Duration in seconds
}

export interface CustomMetric {
  value: number;
  unit: string;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  children: TodoItem[];
  collapsed: boolean;
  parentId: string | null;
  note?: string;
  noteColor?: 'red' | 'orange' | 'green' | 'blue';
  bookmarked?: boolean;
  timeSpent?: number; // Time spent in seconds (maintained for backward compatibility)
  timeEntries?: TimeEntry[]; // Array of time tracking entries
  dueDate?: Date | null; // Optional due date for the todo
  pinned?: boolean; // Whether the todo is pinned to the top
  checkedDate?: string; // Date when the todo was marked as completed
  cost?: number | null; // Cost associated with the todo
  timeEstimate?: number | null; // Estimated time in seconds
  storyPoints?: number | null; // Story points for effort/complexity estimation
  linkedListId?: string | null; // Reference to another todo list
  priority?: 'blocker' | 'important' | 'low' | 'lowest' | null; // Priority level of the todo
  customMetrics?: CustomMetric[]; // Array of custom metrics
  // Legacy fields for backward compatibility
  customMetricValue?: number | null; // Custom numeric metric value (deprecated)
  customMetricUnit?: string | null; // Unit for the custom metric (deprecated)
}

interface TodoContextType {
  todos: TodoItem[];
  filteredTodos: TodoItem[];
  pinnedTodos: TodoItem[]; // Array of pinned todos
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  replaceInTodos: (searchText: string, replaceText: string) => void;
  addTodo: (text: string, parentId: string | null) => string;
  toggleTodo: (id: string, timeToAdd?: number) => void;
  editTodo: (id: string, text: string) => void;
  removeTodo: (id: string) => void;
  toggleCollapse: (id: string) => void;
  duplicateTodo: (id: string) => void;
  combineTodo: (id: string) => void;
  importFromMarkdown: (markdown: string, parentId: string | null) => void;
  exportToMarkdown: (includeStatus: boolean, includeCosts?: boolean, includeStoryPoints?: boolean, includeTimeEstimates?: boolean, includePriority?: boolean, includeTodoNotes?: boolean) => string;
  exportToJira: (includeStatus: boolean, includeCosts?: boolean, includeStoryPoints?: boolean, includeTimeEstimates?: boolean, includePriority?: boolean, includeTodoNotes?: boolean) => string;
  exportToHtml: (includeStatus: boolean, includeCosts?: boolean, includeStoryPoints?: boolean, includeTimeEstimates?: boolean, includePriority?: boolean, includeTodoNotes?: boolean) => string;
  moveTodo: (id: string, destinationId: string | null, position?: number) => void;
  expandTodo: (id: string) => void;
  expandAllTodos: () => void;
  collapseAllTodos: () => void;
  collapseCompletedTodos: () => void;
  clearAllTodos: () => void;
  clearCheckedTodos: () => void;
  splitTodo: (id: string, cursorPosition: number) => void;
  addNote: (id: string, note: string, noteColor?: 'red' | 'orange' | 'green' | 'blue') => void;
  removeNote: (id: string) => void;
  toggleBookmark: (id: string) => void;
  navigateToBookmark: () => void;
  bookmarkedTodoId: string | null;
  sortChildrenAscending: (id: string) => void;
  sortChildrenDescending: (id: string) => void;
  sortRootTodosAscending: () => void;
  sortRootTodosDescending: () => void;
  sortRootTodosByCost: (ascending?: boolean) => void; // Sort root todos by cost
  sortRootTodosByStoryPoints: (ascending?: boolean) => void; // Sort root todos by story points
  sortRootTodosByTimeEstimate: (ascending?: boolean) => void; // Sort root todos by time estimate
  setDueDate: (id: string, dueDate: Date | null) => void;
  togglePinned: (id: string) => void; // Toggle pinned status of a todo
  setCost: (id: string, cost: number | null) => void; // Set cost for a todo
  setTimeEstimate: (id: string, timeEstimate: number | null) => void; // Set time estimate for a todo
  setStoryPoints: (id: string, storyPoints: number | null) => void; // Set story points for a todo
  setLinkedList: (id: string, listId: string | null) => void; // Link a todo to another list
  setPriority: (id: string, priority: 'blocker' | 'important' | 'low' | 'lowest' | null) => void; // Set priority for a todo
  setCustomMetric: (id: string, value: number | null, unit: string | null) => void; // Set custom metric for a todo (legacy)
  addCustomMetric: (id: string, value: number, unit: string) => void; // Add a custom metric to a todo
  removeCustomMetric: (id: string, unit: string) => void; // Remove a custom metric from a todo
  getLinkedListStats: (listId: string) => any; // Get statistics for a linked list
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  lastModifiedTodoId: string | null;
  globalNotes: string;
  setGlobalNotes: (notes: string) => void;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export const useTodoContext = () => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodoContext must be used within a TodoProvider');
  }
  return context;
};

interface HistoryState {
  past: TodoItem[][];
  present: TodoItem[];
  future: TodoItem[][];
}

interface TodoListData {
  todos: TodoItem[];
  globalNotes: string;
}

export const TodoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeListId, lists, updateListTodos, updateListGlobalNotes } = useTodoLists();
  
  // Use a history state to track undo/redo
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: [],
    future: []
  });

  // Track the last modified todo ID
  const [lastModifiedTodoId, setLastModifiedTodoId] = useState<string | null>(null);
  
  // Track the bookmarked todo ID
  const [bookmarkedTodoId, setBookmarkedTodoId] = useState<string | null>(null);
  
  // Global notes for the current list
  const [globalNotes, setGlobalNotes] = useState<string>('');
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Throttle search input for performance
  const throttledSearchQuery = useThrottledValue(searchQuery, 300);

  // Clear the highlight after a timeout
  useEffect(() => {
    if (lastModifiedTodoId) {
      const timer = setTimeout(() => {
        setLastModifiedTodoId(null);
      }, 3000); // Clear after 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [lastModifiedTodoId]);

  // Computed properties for undo/redo availability
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  // Helper function to update todos with history tracking
  const setTodos = (newTodos: TodoItem[]) => {
    // Only add to history if there's an actual change
    if (JSON.stringify(history.present) !== JSON.stringify(newTodos)) {
      setHistory(prev => ({
        past: [...prev.past, prev.present],
        present: newTodos,
        future: []
      }));
      
      // Update the active list in the TodoListsContext
      if (activeListId) {
        updateListTodos(activeListId, newTodos);
      }
    } else {
      // If no change, just update the active list without modifying history
      if (activeListId) {
        updateListTodos(activeListId, newTodos);
      }
    }
  };

  // Load todos and global notes from the active list whenever it changes
  useEffect(() => {
    if (activeListId) {
      const activeList = lists.find(list => list.id === activeListId);
      if (activeList) {
        // Only reset history if the active list has changed or if it's the initial load
        const currentTodos = JSON.stringify(history.present);
        const newTodos = JSON.stringify(activeList.todos);
        
        if (currentTodos !== newTodos) {
          setHistory({
            past: [],
            present: activeList.todos,
            future: []
          });
        }
        
        // Load global notes for the active list
        setGlobalNotes(activeList.globalNotes || '');
      }
    }
  }, [activeListId, lists, history.present]);

  // Helper function to find a todo by id in the nested structure
  const findTodoById = (
    id: string,
    items: TodoItem[]
  ): { todo: TodoItem | null; parent: TodoItem | null; path: TodoItem[] } => {
    const search = (
      currentItems: TodoItem[],
      parentItem: TodoItem | null,
      currentPath: TodoItem[]
    ): { todo: TodoItem | null; parent: TodoItem | null; path: TodoItem[] } => {
      for (const item of currentItems) {
        if (item.id === id) {
          return { todo: item, parent: parentItem, path: [...currentPath, item] };
        }
        
        const result = search(item.children, item, [...currentPath, item]);
        if (result.todo) {
          return result;
        }
      }
      
      return { todo: null, parent: null, path: [] };
    };
    
    return search(items, null, []);
  };

  // Helper function to update a todo in the nested structure
  const updateTodoInTree = (
    todos: TodoItem[],
    updatedTodo: TodoItem,
    parentId: string | null = null
  ): TodoItem[] => {
    return todos.map(todo => {
      if (todo.id === updatedTodo.id) {
        return { ...updatedTodo, parentId };
      }
      
      if (todo.children.length > 0) {
        return {
          ...todo,
          children: updateTodoInTree(todo.children, updatedTodo, todo.id),
        };
      }
      
      return todo;
    });
  };

  // Helper function to check if all children are completed
  const areAllChildrenCompleted = (children: TodoItem[]): boolean => {
    if (children.length === 0) return true;
    return children.every(child => 
      child.completed && areAllChildrenCompleted(child.children)
    );
  };

  // Helper function to update parent completion status based on children
  const updateParentCompletionStatus = (todos: TodoItem[]): TodoItem[] => {
    return todos.map(todo => {
      if (todo.children.length > 0) {
        const updatedChildren = updateParentCompletionStatus(todo.children);
        const allChildrenCompleted = areAllChildrenCompleted(updatedChildren);
        
        return {
          ...todo,
          children: updatedChildren,
          completed: allChildrenCompleted,
        };
      }
      return todo;
    });
  };

  // Add a new todo
  const addTodo = (text: string, parentId: string | null): string => {
    const newTodo: TodoItem = {
      id: Date.now().toString(),
      text,
      completed: false,
      children: [],
      collapsed: false,
      parentId,
      timeEntries: [], // Initialize with empty time entries array
    };

    // Set this as the last modified todo
    setLastModifiedTodoId(newTodo.id);
    
    // Automatically bookmark this new todo
    const bookmarkedTodo = { ...newTodo, bookmarked: true };
    
    // First, remove any existing bookmarks
    const removeAllBookmarks = (items: TodoItem[]): TodoItem[] => {
      return items.map(item => ({
        ...item,
        bookmarked: false,
        children: removeAllBookmarks(item.children),
      }));
    };
    
    // Update the bookmarked todo ID state
    setBookmarkedTodoId(newTodo.id);

    if (!parentId) {
      // Add to root level with bookmark
      const unbookmarkedTodos = removeAllBookmarks(history.present);
      setTodos([...unbookmarkedTodos, bookmarkedTodo]);
    } else {
      // Add as a child to the specified parent
      const addToChildren = (items: TodoItem[]): TodoItem[] => {
        return items.map(item => {
          if (item.id === parentId) {
            return {
              ...item,
              children: [...item.children, bookmarkedTodo],
            };
          }
          if (item.children.length > 0) {
            return {
              ...item,
              children: addToChildren(item.children),
            };
          }
          return item;
        });
      };
      
      const unbookmarkedTodos = removeAllBookmarks(history.present);
      setTodos(addToChildren(unbookmarkedTodos));
      
      // Ensure the parent and all ancestors are expanded to make the new todo visible
      expandTodo(newTodo.id);
    }
    
    // Return the ID of the newly created todo
    return newTodo.id;
  };

  // Toggle a todo's completed status
  const toggleTodo = (id: string, timeToAdd?: number) => {
    // Set this as the last modified todo
    setLastModifiedTodoId(id);
    
    // Automatically bookmark this todo
    updateBookmarkForTodo(id);
    
    // Ensure the todo and its ancestors are expanded
    expandTodo(id);
    
    // First, find and toggle the specific todo
    const toggleInTree = (items: TodoItem[]): TodoItem[] => {
      return items.map(item => {
        if (item.id === id) {
          // Toggle this item
          const newCompleted = !item.completed;
          
          // If marking as completed, also mark all children as completed
          const updateChildren = (children: TodoItem[]): TodoItem[] => {
            return children.map(child => ({
              ...child,
              completed: newCompleted ? true : child.completed,
              // Set checkedDate for all children when marking as completed
              checkedDate: newCompleted ? new Date().toISOString() : undefined,
              children: updateChildren(child.children),
            }));
          };
          
          // Update time spent if provided
          const currentTimeSpent = item.timeSpent || 0;
          const newTimeSpent = timeToAdd ? currentTimeSpent + timeToAdd : currentTimeSpent;
          
          // Initialize timeEntries array if it doesn't exist
          const timeEntries = item.timeEntries || [];
          
          // Add a new time entry if time is being added
          let updatedTimeEntries = timeEntries;
          if (timeToAdd && timeToAdd > 0) {
            // Get the current time for the end timestamp
            const endTime = Date.now();
            // Calculate the start time based on the elapsed time
            const startTime = endTime - (timeToAdd * 1000);
            
            // Add the new time entry
            updatedTimeEntries = [
              ...timeEntries,
              {
                startTime,
                endTime,
                duration: timeToAdd
              }
            ];
            
            // Log for debugging
            console.log('Added time entry:', {
              todoId: item.id,
              todoText: item.text,
              startTime,
              endTime,
              duration: timeToAdd
            });
          }
          
          return {
            ...item,
            completed: newCompleted,
            // Set or clear checkedDate based on completion status
            checkedDate: newCompleted ? new Date().toISOString() : undefined,
            children: newCompleted ? updateChildren(item.children) : item.children,
            timeSpent: newTimeSpent,
            timeEntries: updatedTimeEntries
          };
        }
        
        if (item.children.length > 0) {
          return {
            ...item,
            children: toggleInTree(item.children),
          };
        }
        
        return item;
      });
    };
    
    const updatedTodos = toggleInTree(history.present);
    
    // Then, update parent completion status based on children
    setTodos(updateParentCompletionStatus(updatedTodos));
  };

  // Edit a todo's text
  const editTodo = (id: string, text: string) => {
    // Set this as the last modified todo
    setLastModifiedTodoId(id);
    
    // Automatically bookmark this todo
    updateBookmarkForTodo(id);
    
    // Ensure the todo and its ancestors are expanded
    expandTodo(id);
    
    const editInTree = (items: TodoItem[]): TodoItem[] => {
      return items.map(item => {
        if (item.id === id) {
          return { ...item, text };
        }
        
        if (item.children.length > 0) {
          return {
            ...item,
            children: editInTree(item.children),
          };
        }
        
        return item;
      });
    };
    
    setTodos(editInTree(history.present));
  };

  // Remove a todo and its children
  const removeTodo = (id: string) => {
    const removeFromTree = (items: TodoItem[]): TodoItem[] => {
      return items.filter(item => {
        if (item.id === id) {
          return false;
        }
        
        if (item.children.length > 0) {
          item.children = removeFromTree(item.children);
        }
        
        return true;
      });
    };
    
    const updatedTodos = removeFromTree([...history.present]);
    setTodos(updateParentCompletionStatus(updatedTodos));
  };

  // Toggle collapse state of a todo
  const toggleCollapse = (id: string) => {
    const toggleInTree = (items: TodoItem[]): TodoItem[] => {
      return items.map(item => {
        if (item.id === id) {
          return { ...item, collapsed: !item.collapsed };
        }
        
        if (item.children.length > 0) {
          return {
            ...item,
            children: toggleInTree(item.children),
          };
        }
        
        return item;
      });
    };
    
    setTodos(toggleInTree(history.present));
  };

  // Duplicate a todo and its children
  const duplicateTodo = (id: string) => {
    const { todo } = findTodoById(id, history.present);
    
    if (!todo) return;
    
    // Create a deep copy with new IDs
    const duplicateWithNewIds = (item: TodoItem): TodoItem => {
      // Create a new timeEntries array if it exists, otherwise initialize it
      const timeEntries = item.timeEntries ? [...item.timeEntries] : [];
      
      return {
        ...item,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        children: item.children.map(duplicateWithNewIds),
        timeEntries: timeEntries,
      };
    };
    
    const duplicatedTodo = duplicateWithNewIds(todo);
    
    // Add the duplicated todo to the same level as the original
    if (todo.parentId === null) {
      // Add to root level
      const index = history.present.findIndex(t => t.id === id);
      const newTodos = [...history.present];
      newTodos.splice(index + 1, 0, duplicatedTodo);
      setTodos(newTodos);
    } else {
      // Add as a sibling to the original
      const addAsSibling = (items: TodoItem[]): TodoItem[] => {
        return items.map(item => {
          if (item.children.some(child => child.id === id)) {
            const index = item.children.findIndex(child => child.id === id);
            const newChildren = [...item.children];
            newChildren.splice(index + 1, 0, { ...duplicatedTodo, parentId: item.id });
            return { ...item, children: newChildren };
          }
          
          if (item.children.length > 0) {
            return {
              ...item,
              children: addAsSibling(item.children),
            };
          }
          
          return item;
        });
      };
      
      setTodos(addAsSibling(history.present));
    }
  };

  // Import todos from Markdown
  const importFromMarkdown = (markdown: string, parentId: string | null) => {
    // Parse the markdown into a nested structure
    const parsedList = parseMarkdownList(markdown);
    
    // Flatten the structure for easier processing
    const flattenedTodos = flattenMarkdownList(parsedList, 'root');
    
    // Create a map to store the real IDs as we create them
    const idMap = new Map<string, string>();
    idMap.set('root', parentId || 'root');
    
    // Process each flattened todo
    let updatedTodos = [...history.present];
    
    flattenedTodos.forEach(flatTodo => {
      // Generate a new ID for this todo
      const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      // Get the real parent ID from our map
      const realParentId = idMap.get(flatTodo.parentId || 'root') || null;
      
      // Map the temporary ID to the real ID
      idMap.set(`temp-${flattenedTodos.indexOf(flatTodo)}`, newId);
      
      // Create the new todo item
      const newTodo: TodoItem = {
        id: newId,
        text: flatTodo.text,
        completed: flatTodo.completed !== undefined ? flatTodo.completed : false,
        children: [],
        collapsed: false,
        parentId: realParentId === 'root' ? null : realParentId,
      };
      
      // Add the todo to the appropriate place in the tree
      if (realParentId === 'root' || realParentId === null) {
        // Add to root level
        updatedTodos = [...updatedTodos, newTodo];
      } else {
        // Add as a child to the specified parent
        const addToChildren = (items: TodoItem[]): TodoItem[] => {
          return items.map(item => {
            if (item.id === realParentId) {
              return {
                ...item,
                children: [...item.children, newTodo],
                // Ensure parent is uncollapsed when adding children
                collapsed: false,
              };
            }
            if (item.children.length > 0) {
              return {
                ...item,
                children: addToChildren(item.children),
              };
            }
            return item;
          });
        };
        
        updatedTodos = addToChildren(updatedTodos);
      }
    });
    
    setTodos(updatedTodos);
  };

  // Expand a todo and all its ancestors
  const expandTodo = (id: string) => {
    const { todo, path } = findTodoById(id, history.present);
    if (!todo) return;
    
    // Expand all todos in the path
    const expandInTree = (items: TodoItem[], pathIds: string[]): TodoItem[] => {
      return items.map(item => {
        if (pathIds.includes(item.id)) {
          return {
            ...item,
            collapsed: false,
            children: expandInTree(item.children, pathIds),
          };
        }
        
        if (item.children.length > 0) {
          return {
            ...item,
            children: expandInTree(item.children, pathIds),
          };
        }
        
        return item;
      });
    };
    
    const pathIds = path.map(item => item.id);
    setTodos(expandInTree(history.present, pathIds));
  };

  // Undo the last action
  const undo = () => {
    if (history.past.length === 0) return;
    
    const newHistory = {
      past: history.past.slice(0, -1),
      present: history.past[history.past.length - 1],
      future: [history.present, ...history.future]
    };
    
    setHistory(newHistory);
    
    // Update the active list in the TodoListsContext
    if (activeListId) {
      updateListTodos(activeListId, newHistory.present);
    }
  };

  // Redo the last undone action
  const redo = () => {
    if (history.future.length === 0) return;
    
    const newHistory = {
      past: [...history.past, history.present],
      present: history.future[0],
      future: history.future.slice(1)
    };
    
    setHistory(newHistory);
    
    // Update the active list in the TodoListsContext
    if (activeListId) {
      updateListTodos(activeListId, newHistory.present);
    }
  };

  // Expand all todos
  const expandAllTodos = () => {
    const expandAll = (items: TodoItem[]): TodoItem[] => {
      return items.map(item => ({
        ...item,
        collapsed: false,
        children: expandAll(item.children)
      }));
    };
    
    setTodos(expandAll(history.present));
  };

  // Collapse all todos
  const collapseAllTodos = () => {
    const collapseAll = (items: TodoItem[]): TodoItem[] => {
      return items.map(item => ({
        ...item,
        collapsed: item.children.length > 0 ? true : false,
        children: collapseAll(item.children)
      }));
    };
    
    setTodos(collapseAll(history.present));
  };
  
  // Collapse only completed todos
  const collapseCompletedTodos = () => {
    const collapseCompleted = (items: TodoItem[]): TodoItem[] => {
      return items.map(item => ({
        ...item,
        // Collapse only if the item is completed and has children
        collapsed: item.completed && item.children.length > 0 ? true : item.collapsed,
        children: collapseCompleted(item.children)
      }));
    };
    
    setTodos(collapseCompleted(history.present));
  };
  
  // Clear all todos
  const clearAllTodos = () => {
    setTodos([]);
  };

  // Clear only checked todos
  const clearCheckedTodos = () => {
    const removeCheckedTodos = (items: TodoItem[]): TodoItem[] => {
      // Filter out completed todos at this level
      return items
        .filter(item => !item.completed)
        .map(item => ({
          ...item,
          // Recursively process children
          children: removeCheckedTodos(item.children)
        }));
    };
    
    setTodos(removeCheckedTodos(history.present));
  };

  // Move a todo to a new parent or position
  const moveTodo = (id: string, destinationId: string | null, position = 0) => {
    // Find the todo to move
    const { todo: todoToMove, parent: sourceParent } = findTodoById(id, history.present);
    if (!todoToMove) return;
    
    // If trying to move to itself or to its own child, prevent it
    if (id === destinationId) return;
    
    // Check if destination is a child of the source (prevent circular references)
    const isChildOfSource = (childId: string, sourceId: string): boolean => {
      const { todo: child } = findTodoById(childId, history.present);
      if (!child) return false;
      
      if (child.parentId === sourceId) return true;
      if (child.parentId === null) return false;
      
      return isChildOfSource(child.parentId, sourceId);
    };
    
    if (destinationId && isChildOfSource(destinationId, id)) {
      return;
    }
    
    // Create a copy of the todo to move
    const todoToInsert = { ...todoToMove, parentId: destinationId };
    
    // First, remove the todo from its current location
    let updatedTodos = [...history.present];
    
    if (sourceParent) {
      // Remove from parent's children
      updatedTodos = updateTodoInTree(
        updatedTodos,
        {
          ...sourceParent,
          children: sourceParent.children.filter(child => child.id !== id)
        }
      );
    } else {
      // Remove from root level
      updatedTodos = updatedTodos.filter(todo => todo.id !== id);
    }
    
    // Then, add it to the new location
    if (destinationId === null) {
      // Add to root level at the specified position
      const newTodos = [...updatedTodos];
      newTodos.splice(position, 0, todoToInsert);
      setTodos(newTodos);
    } else {
      // Add to the destination's children
      const addToDestination = (items: TodoItem[]): TodoItem[] => {
        return items.map(item => {
          if (item.id === destinationId) {
            const newChildren = [...item.children];
            newChildren.splice(position, 0, todoToInsert);
            
            return {
              ...item,
              children: newChildren,
              // Ensure destination is expanded
              collapsed: false
            };
          }
          
          if (item.children.length > 0) {
            return {
              ...item,
              children: addToDestination(item.children)
            };
          }
          
          return item;
        });
      };
      
      setTodos(addToDestination(updatedTodos));
    }
  };

  // Split a todo at the cursor position
  const splitTodo = (id: string, cursorPosition: number) => {
    const { todo, parent } = findTodoById(id, history.present);
    if (!todo || cursorPosition <= 0 || cursorPosition >= todo.text.length) return;
    
    // Split the text at the cursor position
    const firstPartText = todo.text.substring(0, cursorPosition);
    const secondPartText = todo.text.substring(cursorPosition);
    
    // Update the original todo with the first part of the text
    const editInTree = (items: TodoItem[], todoId: string, newText: string): TodoItem[] => {
      return items.map(item => {
        if (item.id === todoId) {
          return { ...item, text: newText };
        }
        
        if (item.children.length > 0) {
          return {
            ...item,
            children: editInTree(item.children, todoId, newText),
          };
        }
        
        return item;
      });
    };
    
    const updatedTodos = editInTree(history.present, id, firstPartText);
    
    // Create a new todo with the second part of the text
    const newTodoId = Date.now().toString();
    const newTodo: TodoItem = {
      id: newTodoId,
      text: secondPartText,
      completed: false,
      children: [],
      collapsed: false,
      parentId: todo.parentId,
    };
    
    // Set this as the last modified todo
    setLastModifiedTodoId(newTodoId);
    
    // Add the new todo after the original one
    if (parent) {
      // Find the position of the original todo in its parent's children
      const index = parent.children.findIndex(child => child.id === id);
      
      // Add the new todo after the original one
      const addAfterOriginal = (items: TodoItem[]): TodoItem[] => {
        return items.map(item => {
          if (item.id === parent.id) {
            const newChildren = [...item.children];
            newChildren.splice(index + 1, 0, newTodo);
            return { ...item, children: newChildren };
          }
          
          if (item.children.length > 0) {
            return {
              ...item,
              children: addAfterOriginal(item.children),
            };
          }
          
          return item;
        });
      };
      
      setTodos(addAfterOriginal(updatedTodos));
    } else {
      // Find the position of the original todo at the root level
      const index = updatedTodos.findIndex(item => item.id === id);
      
      // Add the new todo after the original one at the root level
      const newTodos = [...updatedTodos];
      newTodos.splice(index + 1, 0, newTodo);
      setTodos(newTodos);
    }
  };
  
  // Add or update a note for a todo
  const addNote = (id: string, note: string, noteColor?: 'red' | 'orange' | 'green' | 'blue') => {
    // Set this as the last modified todo
    setLastModifiedTodoId(id);
    
    // Automatically bookmark this todo
    updateBookmarkForTodo(id);
    
    const updateNoteInTree = (items: TodoItem[]): TodoItem[] => {
      return items.map(item => {
        if (item.id === id) {
          return { ...item, note, noteColor };
        }
        
        if (item.children.length > 0) {
          return {
            ...item,
            children: updateNoteInTree(item.children),
          };
        }
        
        return item;
      });
    };
    
    setTodos(updateNoteInTree(history.present));
  };
  
  // Remove a note from a todo
  const removeNote = (id: string) => {
    // Set this as the last modified todo
    setLastModifiedTodoId(id);
    
    // Automatically bookmark this todo
    updateBookmarkForTodo(id);
    
    const removeNoteInTree = (items: TodoItem[]): TodoItem[] => {
      return items.map(item => {
        if (item.id === id) {
          const { note, noteColor, ...rest } = item;
          return rest;
        }
        
        if (item.children.length > 0) {
          return {
            ...item,
            children: removeNoteInTree(item.children),
          };
        }
        
        return item;
      });
    };
    
    setTodos(removeNoteInTree(history.present));
  };
  
  // Toggle bookmark for a todo
  const toggleBookmark = (id: string) => {
    // First, remove any existing bookmarks
    const removeAllBookmarks = (items: TodoItem[]): TodoItem[] => {
      return items.map(item => ({
        ...item,
        bookmarked: false,
        children: removeAllBookmarks(item.children),
      }));
    };
    
    // Then, toggle the bookmark for the specific todo
    const toggleBookmarkInTree = (items: TodoItem[], todoId: string): TodoItem[] => {
      return items.map(item => {
        if (item.id === todoId) {
          // If this item is already bookmarked, remove the bookmark
          // Otherwise, add a bookmark
          const newBookmarked = !(item.bookmarked === true);
          
          // Update the bookmarked todo ID state
          if (newBookmarked) {
            setBookmarkedTodoId(item.id);
          } else {
            setBookmarkedTodoId(null);
          }
          
          return { ...item, bookmarked: newBookmarked };
        }
        
        if (item.children.length > 0) {
          return {
            ...item,
            children: toggleBookmarkInTree(item.children, todoId),
          };
        }
        
        return item;
      });
    };
    
    // First remove all bookmarks, then add the new one
    const unbookmarkedTodos = removeAllBookmarks(history.present);
    setTodos(toggleBookmarkInTree(unbookmarkedTodos, id));
    
    // Set this as the last modified todo
    setLastModifiedTodoId(id);
  };
  
  // Navigate to the bookmarked todo
  const navigateToBookmark = () => {
    if (bookmarkedTodoId) {
      // Expand the todo and its ancestors to make it visible
      expandTodo(bookmarkedTodoId);
      
      // Set it as the last modified to highlight it
      setLastModifiedTodoId(bookmarkedTodoId);
      
      // Scroll to the bookmarked todo
      setTimeout(() => {
        const element = document.getElementById(`todo-item-${bookmarkedTodoId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };
  
  // Helper function to update bookmark for a todo
  const updateBookmarkForTodo = (id: string) => {
    // Find if the todo exists in the current tree
    const { todo } = findTodoById(id, history.present);
    if (todo) {
      // Set the bookmark to this todo
      const removeAllBookmarks = (items: TodoItem[]): TodoItem[] => {
        return items.map(item => ({
          ...item,
          bookmarked: false,
          children: removeAllBookmarks(item.children),
        }));
      };
      
      const addBookmarkToTodo = (items: TodoItem[], todoId: string): TodoItem[] => {
        return items.map(item => {
          if (item.id === todoId) {
            return { ...item, bookmarked: true };
          }
          
          if (item.children.length > 0) {
            return {
              ...item,
              children: addBookmarkToTodo(item.children, todoId),
            };
          }
          
          return item;
        });
      };
      
      // Update the bookmarked todo ID state
      setBookmarkedTodoId(id);
      
      // First remove all bookmarks, then add the new one
      const unbookmarkedTodos = removeAllBookmarks(history.present);
      return addBookmarkToTodo(unbookmarkedTodos, id);
    }
    
    return history.present;
  };

  // Update bookmark when a todo is modified
  useEffect(() => {
    if (lastModifiedTodoId && !bookmarkedTodoId) {
      // Find if the todo exists in the current tree
      const { todo } = findTodoById(lastModifiedTodoId, history.present);
      if (todo) {
        // Set the bookmark to the last modified todo
        const updatedTodos = updateBookmarkForTodo(lastModifiedTodoId);
        setTodos(updatedTodos);
      }
    }
  }, [lastModifiedTodoId]);
  
  // Combine a todo with its children
  const combineTodo = (id: string) => {
    const { todo } = findTodoById(id, history.present);
    if (!todo || todo.children.length === 0) return;
    
    // Set this as the last modified todo
    setLastModifiedTodoId(id);
    
    // Get the text of all children
    const childrenTexts = todo.children.map(child => child.text);
    
    // Create the combined text
    const combinedText = `${todo.text}: ${childrenTexts.join(', ')}`;
    
    // Update the todo with the combined text and remove its children
    const combineInTree = (items: TodoItem[]): TodoItem[] => {
      return items.map(item => {
        if (item.id === id) {
          return { 
            ...item, 
            text: combinedText,
            children: [] // Remove all children
          };
        }
        
        if (item.children.length > 0) {
          return {
            ...item,
            children: combineInTree(item.children),
          };
        }
        
        return item;
      });
    };
    
    setTodos(combineInTree(history.present));
  };

  // Export todos to Markdown format
  const exportToMarkdown = (
    includeStatus: boolean,
    includeCosts: boolean = false,
    includeStoryPoints: boolean = false,
    includeTimeEstimates: boolean = false,
    includePriority: boolean = false,
    includeTodoNotes: boolean = false
  ): string => {
    return convertTodosToMarkdown(
      history.present as TodoItemForExport[], 
      includeStatus,
      includeCosts,
      includeStoryPoints,
      includeTimeEstimates,
      includePriority,
      includeTodoNotes
    );
  };

  // Export todos to Jira format
  const exportToJira = (
    includeStatus: boolean,
    includeCosts: boolean = false,
    includeStoryPoints: boolean = false,
    includeTimeEstimates: boolean = false,
    includePriority: boolean = false,
    includeTodoNotes: boolean = false
  ): string => {
    return convertTodosToJira(
      history.present as TodoItemForExport[], 
      includeStatus,
      includeCosts,
      includeStoryPoints,
      includeTimeEstimates,
      includePriority,
      includeTodoNotes
    );
  };
  
  // Export todos to HTML format
  const exportToHtml = (
    includeStatus: boolean,
    includeCosts: boolean = false,
    includeStoryPoints: boolean = false,
    includeTimeEstimates: boolean = false,
    includePriority: boolean = false,
    includeTodoNotes: boolean = false
  ): string => {
    return convertTodosToHtml(
      history.present as TodoItemForExport[], 
      includeStatus,
      includeCosts,
      includeStoryPoints,
      includeTimeEstimates,
      includePriority,
      includeTodoNotes
    );
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
  };

  // Replace text in all todos that match the search query
  const replaceInTodos = (searchText: string, replaceText: string) => {
    if (!searchText.trim()) return;

    const searchTermLower = searchText.toLowerCase();
    
    // Helper function to replace text in a todo
    const replaceTextInTodo = (todo: TodoItem): TodoItem => {
      // Check if this todo's text contains the search term
      if (todo.text.toLowerCase().includes(searchTermLower)) {
        // Create a case-insensitive regex for replacement
        const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const newText = todo.text.replace(regex, replaceText);
        
        return {
          ...todo,
          text: newText,
          children: todo.children.map(replaceTextInTodo)
        };
      }
      
      // If this todo doesn't match, still check its children
      if (todo.children.length > 0) {
        return {
          ...todo,
          children: todo.children.map(replaceTextInTodo)
        };
      }
      
      return todo;
    };
    
    // Apply the replacement to all todos
    const updatedTodos = history.present.map(replaceTextInTodo);
    
    // Set the last modified todo ID to null since multiple todos might be modified
    setLastModifiedTodoId(null);
    
    // Update the todos
    setTodos(updatedTodos);
  };

  // Get all pinned todos
  const pinnedTodos = useMemo(() => {
    // Helper function to find all pinned todos in the tree
    const findPinnedTodos = (todos: TodoItem[]): TodoItem[] => {
      const result: TodoItem[] = [];
      
      const traverse = (items: TodoItem[]) => {
        items.forEach(todo => {
          if (todo.pinned) {
            // Create a reference to the original todo (not a deep copy)
            result.push(todo);
          }
          
          // Continue traversing children
          if (todo.children.length > 0) {
            traverse(todo.children);
          }
        });
      };
      
      traverse(todos);
      return result;
    };
    
    return findPinnedTodos(history.present);
  }, [history.present]);
  
  // Filter todos based on search query
  const filteredTodos = useMemo(() => {
    if (!throttledSearchQuery.trim()) {
      return history.present;
    }

    const searchTermLower = throttledSearchQuery.toLowerCase();
    
    // Helper function to check if a todo or any of its children match the search
    const todoMatchesSearch = (todo: TodoItem): boolean => {
      return todo.text.toLowerCase().includes(searchTermLower);
    };
    
    // Helper function to find all matching todos and their parent paths
    const findMatchingTodosWithParents = (
      todos: TodoItem[],
      parentPath: TodoItem[] = []
    ): TodoItem[] => {
      const result: TodoItem[] = [];
      
      todos.forEach(todo => {
        const currentPath = [...parentPath, todo];
        const todoMatches = todoMatchesSearch(todo);
        
        // Check if any children match
        const matchingChildren = findMatchingTodosWithParents(
          todo.children,
          currentPath
        );
        
        // If this todo matches or has matching children
        if (todoMatches || matchingChildren.length > 0) {
          // Create a copy of this todo with only matching children
          const filteredTodo: TodoItem = {
            ...todo,
            children: matchingChildren,
            // Ensure parent todos are expanded to show matching children
            collapsed: matchingChildren.length > 0 ? false : todo.collapsed
          };
          
          result.push(filteredTodo);
        }
      });
      
      return result;
    };
    
    return findMatchingTodosWithParents(history.present);
  }, [throttledSearchQuery, history.present]);

  // Update global notes and save to the active list
  const handleSetGlobalNotes = (notes: string) => {
    setGlobalNotes(notes);
    
    // Update the active list in the TodoListsContext
    if (activeListId) {
      updateListGlobalNotes(activeListId, notes);
    }
  };

  // Sort children of a todo in ascending order
  const sortChildrenAscending = (id: string) => {
    const { todo } = findTodoById(id, history.present);
    if (!todo || todo.children.length <= 1) return;
    
    // Set this as the last modified todo
    setLastModifiedTodoId(id);
    
    const sortInTree = (items: TodoItem[]): TodoItem[] => {
      return items.map(item => {
        if (item.id === id) {
          // Sort children alphabetically by text
          const sortedChildren = [...item.children].sort((a, b) => 
            a.text.toLowerCase().localeCompare(b.text.toLowerCase())
          );
          
          return { ...item, children: sortedChildren };
        }
        
        if (item.children.length > 0) {
          return {
            ...item,
            children: sortInTree(item.children),
          };
        }
        
        return item;
      });
    };
    
    setTodos(sortInTree(history.present));
  };
  
  // Sort children of a todo in descending order
  const sortChildrenDescending = (id: string) => {
    const { todo } = findTodoById(id, history.present);
    if (!todo || todo.children.length <= 1) return;
    
    // Set this as the last modified todo
    setLastModifiedTodoId(id);
    
    const sortInTree = (items: TodoItem[]): TodoItem[] => {
      return items.map(item => {
        if (item.id === id) {
          // Sort children alphabetically by text in reverse order
          const sortedChildren = [...item.children].sort((a, b) => 
            b.text.toLowerCase().localeCompare(a.text.toLowerCase())
          );
          
          return { ...item, children: sortedChildren };
        }
        
        if (item.children.length > 0) {
          return {
            ...item,
            children: sortInTree(item.children),
          };
        }
        
        return item;
      });
    };
    
    setTodos(sortInTree(history.present));
  };

  // Sort root todos in ascending order (A-Z)
  const sortRootTodosAscending = () => {
    // Sort only the root level todos alphabetically by text
    const sortedTodos = [...history.present].sort((a, b) => 
      a.text.toLowerCase().localeCompare(b.text.toLowerCase())
    );
    
    setTodos(sortedTodos);
  };
  
  // Sort root todos in descending order (Z-A)
  const sortRootTodosDescending = () => {
    // Sort only the root level todos alphabetically by text in reverse order
    const sortedTodos = [...history.present].sort((a, b) => 
      b.text.toLowerCase().localeCompare(a.text.toLowerCase())
    );
    
    setTodos(sortedTodos);
  };

  // Set due date for a todo (no longer propagates to children)
  const setDueDate = (id: string, dueDate: Date | null) => {
    // Set this as the last modified todo
    setLastModifiedTodoId(id);
    
    // Automatically bookmark this todo
    updateBookmarkForTodo(id);
    
    // Ensure the todo and its ancestors are expanded
    expandTodo(id);
    
    // Update the due date for this todo only (not its children)
    const updateDueDateInTree = (items: TodoItem[]): TodoItem[] => {
      return items.map(item => {
        if (item.id === id) {
          return {
            ...item,
            dueDate: dueDate ? new Date(dueDate) : null
          };
        }
        
        if (item.children.length > 0) {
          return {
            ...item,
            children: updateDueDateInTree(item.children)
          };
        }
        
        return item;
      });
    };
    
    setTodos(updateDueDateInTree(history.present));
  };
  
  // Toggle pinned status of a todo
  const togglePinned = (id: string) => {
    // Set this as the last modified todo
    setLastModifiedTodoId(id);
    
    // Update the pinned status for this todo
    const updatePinnedInTree = (items: TodoItem[]): TodoItem[] => {
      return items.map(item => {
        if (item.id === id) {
          // Toggle the pinned status
          return {
            ...item,
            pinned: !item.pinned
          };
        }
        
        if (item.children.length > 0) {
          return {
            ...item,
            children: updatePinnedInTree(item.children)
          };
        }
        
        return item;
      });
    };
    
    setTodos(updatePinnedInTree(history.present));
  };
  
  // Set cost for a todo
  const setCost = (id: string, cost: number | null) => {
    // Set this as the last modified todo
    setLastModifiedTodoId(id);
    
    // Automatically bookmark this todo
    updateBookmarkForTodo(id);
    
    // Ensure the todo and its ancestors are expanded
    expandTodo(id);
    
    // Update the cost for this todo
    const updateCostInTree = (items: TodoItem[]): TodoItem[] => {
      return items.map(item => {
        if (item.id === id) {
          return {
            ...item,
            cost: cost
          };
        }
        
        if (item.children.length > 0) {
          return {
            ...item,
            children: updateCostInTree(item.children)
          };
        }
        
        return item;
      });
    };
    
    setTodos(updateCostInTree(history.present));
  };
  
  // Set time estimate for a todo
  const setTimeEstimate = (id: string, timeEstimate: number | null) => {
    // Set this as the last modified todo
    setLastModifiedTodoId(id);
    
    // Automatically bookmark this todo
    updateBookmarkForTodo(id);
    
    // Ensure the todo and its ancestors are expanded
    expandTodo(id);
    
    // Update the time estimate for this todo
    const updateTimeEstimateInTree = (items: TodoItem[]): TodoItem[] => {
      return items.map(item => {
        if (item.id === id) {
          return {
            ...item,
            timeEstimate: timeEstimate
          };
        }
        
        if (item.children.length > 0) {
          return {
            ...item,
            children: updateTimeEstimateInTree(item.children)
          };
        }
        
        return item;
      });
    };
    
    setTodos(updateTimeEstimateInTree(history.present));
  };
  
  // Set story points for a todo
  const setStoryPoints = (id: string, storyPoints: number | null) => {
    // Set this as the last modified todo
    setLastModifiedTodoId(id);
    
    // Automatically bookmark this todo
    updateBookmarkForTodo(id);
    
    // Ensure the todo and its ancestors are expanded
    expandTodo(id);
    
    // Update the story points for this todo
    const updateStoryPointsInTree = (items: TodoItem[]): TodoItem[] => {
      return items.map(item => {
        if (item.id === id) {
          return {
            ...item,
            storyPoints: storyPoints
          };
        }
        
        if (item.children.length > 0) {
          return {
            ...item,
            children: updateStoryPointsInTree(item.children)
          };
        }
        
        return item;
      });
    };
    
    setTodos(updateStoryPointsInTree(history.present));
  };
  
  // Set priority for a todo
  const setPriority = (id: string, priority: 'blocker' | 'important' | 'low' | 'lowest' | null) => {
    // Set this as the last modified todo
    setLastModifiedTodoId(id);
    
    // Automatically bookmark this todo
    updateBookmarkForTodo(id);
    
    // Ensure the todo and its ancestors are expanded
    expandTodo(id);
    
    // Update the priority for this todo
    const updatePriorityInTree = (items: TodoItem[]): TodoItem[] => {
      return items.map(item => {
        if (item.id === id) {
          return {
            ...item,
            priority: priority
          };
        }
        
        if (item.children.length > 0) {
          return {
            ...item,
            children: updatePriorityInTree(item.children)
          };
        }
        
        return item;
      });
    };
    
    setTodos(updatePriorityInTree(history.present));
  };
  
  // Link a todo to another list
  const setLinkedList = (id: string, listId: string | null) => {
    // Set this as the last modified todo
    setLastModifiedTodoId(id);
    
    // Automatically bookmark this todo
    updateBookmarkForTodo(id);
    
    // Ensure the todo and its ancestors are expanded
    expandTodo(id);
    
    // Update the linked list for this todo
    const updateLinkedListInTree = (items: TodoItem[]): TodoItem[] => {
      return items.map(item => {
        if (item.id === id) {
          return {
            ...item,
            linkedListId: listId
          };
        }
        
        if (item.children.length > 0) {
          return {
            ...item,
            children: updateLinkedListInTree(item.children)
          };
        }
        
        return item;
      });
    };
    
    setTodos(updateLinkedListInTree(history.present));
  };
  
  // Get statistics for a linked list
  const getLinkedListStats = (listId: string) => {
    const linkedList = lists.find(list => list.id === listId);
    if (!linkedList) return null;
    
    return getTotalStats(linkedList.todos);
  };

    // Sort root todos by cost
  const sortRootTodosByCost = (ascending: boolean = true) => {
    // Sort only the root level todos by cost
    const sortedTodos = [...history.present].sort((a, b) => {
      // Always place null/undefined values at the end regardless of sort direction
      if (a.cost === null || a.cost === undefined) return 1;
      if (b.cost === null || b.cost === undefined) return -1;
      
      // Sort by cost
      return ascending 
        ? a.cost - b.cost 
        : b.cost - a.cost;
    });
    
    setTodos(sortedTodos);
  };
  
  // Sort root todos by story points
  const sortRootTodosByStoryPoints = (ascending: boolean = true) => {
    // Sort only the root level todos by story points
    const sortedTodos = [...history.present].sort((a, b) => {
      // Always place null/undefined values at the end regardless of sort direction
      if (a.storyPoints === null || a.storyPoints === undefined) return 1;
      if (b.storyPoints === null || b.storyPoints === undefined) return -1;
      
      // Sort by story points
      return ascending 
        ? a.storyPoints - b.storyPoints 
        : b.storyPoints - a.storyPoints;
    });
    
    setTodos(sortedTodos);
  };
  
  // Sort root todos by time estimate
  const sortRootTodosByTimeEstimate = (ascending: boolean = true) => {
    // Sort only the root level todos by time estimate
    const sortedTodos = [...history.present].sort((a, b) => {
      // Always place null/undefined values at the end regardless of sort direction
      if (a.timeEstimate === null || a.timeEstimate === undefined) return 1;
      if (b.timeEstimate === null || b.timeEstimate === undefined) return -1;
      
      // Sort by time estimate
      return ascending 
        ? a.timeEstimate - b.timeEstimate 
        : b.timeEstimate - a.timeEstimate;
    });
    
    setTodos(sortedTodos);
  };

  // Set custom metric for a todo (legacy support)
  const setCustomMetric = (id: string, value: number | null, unit: string | null) => {
    // Set this as the last modified todo
    setLastModifiedTodoId(id);
    
    // Automatically bookmark this todo
    updateBookmarkForTodo(id);
    
    // Ensure the todo and its ancestors are expanded
    expandTodo(id);
    
    // Update the custom metric for this todo
    const updateCustomMetricInTree = (items: TodoItem[]): TodoItem[] => {
      return items.map(item => {
        if (item.id === id) {
          // If we're clearing the metric
          if (value === null || unit === null) {
            // Remove the legacy fields
            const { customMetricValue, customMetricUnit, ...rest } = item;
            
            // Also clear the new customMetrics array if it exists
            if (rest.customMetrics) {
              rest.customMetrics = [];
            }
            
            return rest;
          }
          
          // If we're setting a new metric, update both the legacy fields and the new array
          const newMetric: CustomMetric = { value, unit };
          
          // Initialize or update the customMetrics array
          let customMetrics = item.customMetrics ? [...item.customMetrics] : [];
          
          // Remove any existing metric with the same unit
          customMetrics = customMetrics.filter(metric => metric.unit !== unit);
          
          // Add the new metric
          customMetrics.push(newMetric);
          
          return {
            ...item,
            customMetricValue: value,
            customMetricUnit: unit,
            customMetrics
          };
        }
        
        if (item.children.length > 0) {
          return {
            ...item,
            children: updateCustomMetricInTree(item.children)
          };
        }
        
        return item;
      });
    };
    
    setTodos(updateCustomMetricInTree(history.present));
  };
  
  // Add a custom metric to a todo
  const addCustomMetric = (id: string, value: number, unit: string) => {
    // Set this as the last modified todo
    setLastModifiedTodoId(id);
    
    // Automatically bookmark this todo
    updateBookmarkForTodo(id);
    
    // Ensure the todo and its ancestors are expanded
    expandTodo(id);
    
    // Add or update the custom metric for this todo
    const updateCustomMetricsInTree = (items: TodoItem[]): TodoItem[] => {
      return items.map(item => {
        if (item.id === id) {
          // Create the new metric
          const newMetric: CustomMetric = { value, unit };
          
          // Initialize or copy the customMetrics array
          let customMetrics = item.customMetrics ? [...item.customMetrics] : [];
          
          // Check if a metric with this unit already exists
          const existingIndex = customMetrics.findIndex(metric => metric.unit === unit);
          
          if (existingIndex >= 0) {
            // Update the existing metric
            customMetrics[existingIndex] = newMetric;
          } else {
            // Add the new metric
            customMetrics.push(newMetric);
          }
          
          // For backward compatibility, update the legacy fields if this is the first metric
          const updateLegacyFields = customMetrics.length === 1;
          
          return {
            ...item,
            customMetrics,
            ...(updateLegacyFields ? { 
              customMetricValue: value, 
              customMetricUnit: unit 
            } : {})
          };
        }
        
        if (item.children.length > 0) {
          return {
            ...item,
            children: updateCustomMetricsInTree(item.children)
          };
        }
        
        return item;
      });
    };
    
    setTodos(updateCustomMetricsInTree(history.present));
  };
  
  // Remove a custom metric from a todo
  const removeCustomMetric = (id: string, unit: string) => {
    // Set this as the last modified todo
    setLastModifiedTodoId(id);
    
    // Automatically bookmark this todo
    updateBookmarkForTodo(id);
    
    // Ensure the todo and its ancestors are expanded
    expandTodo(id);
    
    // Remove the custom metric for this todo
    const removeCustomMetricInTree = (items: TodoItem[]): TodoItem[] => {
      return items.map(item => {
        if (item.id === id) {
          // If there's no customMetrics array, nothing to remove
          if (!item.customMetrics || item.customMetrics.length === 0) {
            return item;
          }
          
          // Filter out the metric with the specified unit
          const updatedMetrics = item.customMetrics.filter(metric => metric.unit !== unit);
          
          // Update legacy fields if needed
          let updatedItem: TodoItem = {
            ...item,
            customMetrics: updatedMetrics
          };
          
          // If we removed the metric that was in the legacy fields, update them
          if (item.customMetricUnit === unit) {
            // If there are other metrics, use the first one for legacy fields
            if (updatedMetrics.length > 0) {
              updatedItem.customMetricValue = updatedMetrics[0].value;
              updatedItem.customMetricUnit = updatedMetrics[0].unit;
            } else {
              // Otherwise, clear the legacy fields
              const { customMetricValue, customMetricUnit, ...rest } = updatedItem;
              updatedItem = rest as TodoItem;
            }
          }
          
          return updatedItem;
        }
        
        if (item.children.length > 0) {
          return {
            ...item,
            children: removeCustomMetricInTree(item.children)
          };
        }
        
        return item;
      });
    };
    
    setTodos(removeCustomMetricInTree(history.present));
  };

  return (
    <TodoContext.Provider
      value={{
        todos: history.present,
        filteredTodos,
        pinnedTodos,
        searchQuery,
        setSearchQuery,
        clearSearch,
        replaceInTodos,
        addTodo,
        toggleTodo,
        editTodo,
        removeTodo,
        toggleCollapse,
        duplicateTodo,
        combineTodo,
        importFromMarkdown,
        exportToMarkdown,
        exportToJira,
        exportToHtml,
        moveTodo,
        expandTodo,
        expandAllTodos,
        collapseAllTodos,
        collapseCompletedTodos,
        clearAllTodos,
        clearCheckedTodos,
        splitTodo,
        addNote,
        removeNote,
        toggleBookmark,
        navigateToBookmark,
        bookmarkedTodoId,
        sortChildrenAscending,
        sortChildrenDescending,
        sortRootTodosAscending,
        sortRootTodosDescending,
        sortRootTodosByCost,
        sortRootTodosByStoryPoints,
        sortRootTodosByTimeEstimate,
        setDueDate,
        togglePinned,
        setCost,
        setTimeEstimate,
        setStoryPoints,
        setLinkedList,
        setPriority,
        setCustomMetric,
        addCustomMetric,
        removeCustomMetric,
        getLinkedListStats,
        undo,
        redo,
        canUndo,
        canRedo,
        lastModifiedTodoId,
        globalNotes,
        setGlobalNotes: handleSetGlobalNotes
      }}
    >
      {children}
    </TodoContext.Provider>
  );
};