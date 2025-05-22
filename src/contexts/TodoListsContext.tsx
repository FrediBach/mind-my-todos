import React, { createContext, useContext, useState, useEffect } from 'react';
import { TodoItem } from './TodoContext';

export interface TodoList {
  id: string;
  name: string;
  todos: TodoItem[];
  globalNotes?: string;
  archived?: boolean;
}

interface TodoListsContextType {
  lists: TodoList[];
  activeListId: string;
  setActiveListId: (id: string) => void;
  addList: (name: string) => void;
  removeList: (id: string) => void;
  renameList: (id: string, name: string) => void;
  updateListTodos: (id: string, todos: TodoItem[]) => void;
  updateListGlobalNotes: (id: string, notes: string) => void;
  getListProgress: (id: string) => number;
  archiveList: (id: string) => void;
  unarchiveList: (id: string) => void;
  getActiveLists: () => TodoList[];
  getArchivedLists: () => TodoList[];
  checkAndArchiveCompletedLists: () => void;
}

const TodoListsContext = createContext<TodoListsContextType | undefined>(undefined);

export const useTodoLists = () => {
  const context = useContext(TodoListsContext);
  if (!context) {
    throw new Error('useTodoLists must be used within a TodoListsProvider');
  }
  return context;
};

export const TodoListsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lists, setLists] = useState<TodoList[]>([]);
  const [activeListId, setActiveListId] = useState<string>('');

  // Calculate progress for a list (percentage of completed todos)
  const calculateProgress = (todos: TodoItem[]): number => {
    const countTodos = (items: TodoItem[]): { total: number; completed: number } => {
      let total = items.length;
      let completed = 0;
      
      for (const item of items) {
        if (item.completed) {
          completed++;
        }
        
        const childCounts = countTodos(item.children);
        total += childCounts.total;
        completed += childCounts.completed;
      }
      
      return { total, completed };
    };
    
    const counts = countTodos(todos);
    return counts.total === 0 ? 0 : Math.round((counts.completed / counts.total) * 100);
  };

  // Get progress for a specific list
  const getListProgress = (id: string): number => {
    const list = lists.find(list => list.id === id);
    if (!list) return 0;
    return calculateProgress(list.todos);
  };

  // Load lists from localStorage on initial render
  useEffect(() => {
    const savedLists = localStorage.getItem('todoLists');
    if (savedLists) {
      try {
        const parsedLists = JSON.parse(savedLists);
        setLists(parsedLists);
        
        // Set active list to the first one if available
        if (parsedLists.length > 0) {
          setActiveListId(parsedLists[0].id);
        }
      } catch (error) {
        console.error('Failed to parse saved todo lists', error);
        // Initialize with a default list
        initializeDefaultList();
      }
    } else {
      // Initialize with a default list
      initializeDefaultList();
    }
  }, []);

  // Initialize with a default list
  const initializeDefaultList = () => {
    const defaultList: TodoList = {
      id: Date.now().toString(),
      name: 'My Todo List',
      todos: []
    };
    
    setLists([defaultList]);
    setActiveListId(defaultList.id);
  };

  // Save lists to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('todoLists', JSON.stringify(lists));
  }, [lists]);

  // Add a new list
  const addList = (name: string) => {
    const newList: TodoList = {
      id: Date.now().toString(),
      name,
      todos: []
    };
    
    setLists(prev => [...prev, newList]);
    setActiveListId(newList.id);
  };

  // Remove a list
  const removeList = (id: string) => {
    // Don't remove the last list
    if (lists.length <= 1) return;
    
    setLists(prev => {
      const newLists = prev.filter(list => list.id !== id);
      
      // If removing the active list, set a new active list
      if (id === activeListId && newLists.length > 0) {
        setActiveListId(newLists[0].id);
      }
      
      return newLists;
    });
  };

  // Rename a list
  const renameList = (id: string, name: string) => {
    setLists(prev => 
      prev.map(list => 
        list.id === id ? { ...list, name } : list
      )
    );
  };

  // Update todos for a specific list
  const updateListTodos = (id: string, todos: TodoItem[]) => {
    setLists(prev => 
      prev.map(list => 
        list.id === id ? { ...list, todos } : list
      )
    );
  };
  
  // Update global notes for a specific list
  const updateListGlobalNotes = (id: string, notes: string) => {
    setLists(prev => 
      prev.map(list => 
        list.id === id ? { ...list, globalNotes: notes } : list
      )
    );
  };
  
  // Archive a list
  const archiveList = (id: string) => {
    setLists(prev => 
      prev.map(list => 
        list.id === id ? { ...list, archived: true } : list
      )
    );
    
    // If the archived list was active, set a new active list
    if (id === activeListId) {
      const activeLists = lists.filter(list => !list.archived && list.id !== id);
      if (activeLists.length > 0) {
        setActiveListId(activeLists[0].id);
      }
    }
  };
  
  // Unarchive a list
  const unarchiveList = (id: string) => {
    setLists(prev => 
      prev.map(list => 
        list.id === id ? { ...list, archived: false } : list
      )
    );
  };
  
  // Get active (non-archived) lists
  const getActiveLists = () => {
    return lists.filter(list => !list.archived);
  };
  
  // Get archived lists
  const getArchivedLists = () => {
    return lists.filter(list => list.archived);
  };
  
  // Check and automatically archive completed lists
  const checkAndArchiveCompletedLists = () => {
    lists.forEach(list => {
      if (!list.archived && getListProgress(list.id) === 100) {
        archiveList(list.id);
      }
    });
  };
  
  // Check for completed lists whenever lists change
  useEffect(() => {
    checkAndArchiveCompletedLists();
  }, [lists]);

  return (
    <TodoListsContext.Provider
      value={{
        lists,
        activeListId,
        setActiveListId,
        addList,
        removeList,
        renameList,
        updateListTodos,
        updateListGlobalNotes,
        getListProgress,
        archiveList,
        unarchiveList,
        getActiveLists,
        getArchivedLists,
        checkAndArchiveCompletedLists
      }}
    >
      {children}
    </TodoListsContext.Provider>
  );
};