import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTodoContext, TodoItem } from '@/contexts/TodoContext';
import { useTodoLists } from '@/contexts/TodoListsContext';
import { Split } from 'lucide-react';

interface SplitToNewListDialogProps {
  todoId: string;
  trigger?: React.ReactNode;
}

const SplitToNewListDialog: React.FC<SplitToNewListDialogProps> = ({ todoId, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [todoToSplit, setTodoToSplit] = useState<TodoItem | null>(null);
  const { todos, removeTodo } = useTodoContext();
  const { addList, lists, updateListTodos } = useTodoLists();

  // Find the todo when the dialog opens
  useEffect(() => {
    if (isOpen) {
      const { todo } = findTodoById(todoId, todos);
      setTodoToSplit(todo);
      
      // Set default list name based on todo text
      if (todo) {
        setNewListName(todo.text);
      }
    } else {
      // Reset state when dialog closes
      setNewListName('');
      setTodoToSplit(null);
    }
  }, [isOpen, todoId, todos]);

  // Find the todo and its subtree
  const findTodoById = (id: string, items: TodoItem[]): { todo: TodoItem | null; path: TodoItem[] } => {
    const search = (
      currentItems: TodoItem[],
      currentPath: TodoItem[]
    ): { todo: TodoItem | null; path: TodoItem[] } => {
      for (const item of currentItems) {
        if (item.id === id) {
          return { todo: item, path: [...currentPath, item] };
        }
        
        const result = search(item.children, [...currentPath, item]);
        if (result.todo) {
          return result;
        }
      }
      
      return { todo: null, path: [] };
    };
    
    return search(items, []);
  };

  const handleSplit = () => {
    if (!newListName.trim() || !todoToSplit) {
      setIsOpen(false);
      return;
    }

    // Create a deep clone of the todo and its children
    const cloneTodo = (item: TodoItem): TodoItem => {
      // Generate a new unique ID for this cloned item
      const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      return {
        ...item,
        id: newId, // Use a new ID to avoid conflicts
        parentId: null, // Root item in the new list has no parent
        children: item.children.map(child => {
          const clonedChild = cloneTodo(child);
          return {
            ...clonedChild,
            parentId: newId // Use the new parent ID for relationships
          };
        })
      };
    };
    
    try {
      const clonedTodo = cloneTodo(todoToSplit);
      
      // Create a new list
      addList(newListName);
      
      // Get the latest list (the one we just created)
      const newListId = lists[lists.length - 1]?.id;
      
      if (newListId) {
        // Update the new list with the cloned todo
        updateListTodos(newListId, [clonedTodo]);
        
        // Remove the original todo from the current list
        removeTodo(todoId);
        
        console.log('Split todo to new list:', {
          todoId,
          newListId,
          newListName
        });
      } else {
        console.error('Failed to get new list ID after creating list');
      }
    } catch (error) {
      console.error('Error splitting todo to new list:', error);
    }
    
    // Close the dialog
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <div className="flex items-center px-2 py-1.5 w-full cursor-pointer">
            <Split className="mr-2 h-4 w-4" />
            <span>Split to new list</span>
          </div>
        </DialogTrigger>
      )}
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Split to New List</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="list-name">New List Name</Label>
            <Input
              id="list-name"
              placeholder="Enter list name"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSplit}>
            Create New List
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SplitToNewListDialog;