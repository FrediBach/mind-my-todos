import { useMemo } from 'react';
import { TodoItem, useTodoContext } from '@/contexts/TodoContext';

/**
 * Custom hook to find a todo's parent and its due date
 * @param todoId - The ID of the todo to find the parent for
 * @returns Object containing the parent todo and its due date
 */
export function useTodoParent(todoId: string | undefined) {
  const { todos } = useTodoContext();
  
  return useMemo(() => {
    if (!todoId) {
      return { parent: null, parentDueDate: null };
    }
    
    // Helper function to find a todo by id in the nested structure
    const findTodoById = (id: string, items: TodoItem[]): { todo: TodoItem | null; parent: TodoItem | null } => {
      const search = (currentItems: TodoItem[], parentItem: TodoItem | null): { todo: TodoItem | null; parent: TodoItem | null } => {
        for (const item of currentItems) {
          if (item.id === id) {
            return { todo: item, parent: parentItem };
          }
          
          const result = search(item.children, item);
          if (result.todo) {
            return result;
          }
        }
        
        return { todo: null, parent: null };
      };
      
      return search(items, null);
    };

    // Find the parent of the current todo
    const { parent } = findTodoById(todoId, todos);
    
    // If parent exists and has a due date, return it
    if (parent && parent.dueDate) {
      return { parent, parentDueDate: new Date(parent.dueDate) };
    }
    
    return { parent, parentDueDate: null };
  }, [todoId, todos]);
}

export default useTodoParent;