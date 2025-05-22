import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTodoContext } from '@/contexts/TodoContext';
import { useConfigContext } from '@/contexts/ConfigContext';
import { isDueToday, isWithinDays } from '@/util/dateUtils';
import { TodoItem } from '@/contexts/TodoContext';

export const DueTodayAlert: React.FC = () => {
  const { todos, expandTodo } = useTodoContext();
  const { config } = useConfigContext();
  const [open, setOpen] = useState(false);
  const [dueTodayItems, setDueTodayItems] = useState<TodoItem[]>([]);

  // Find all todos due today or within alert days
  useEffect(() => {
    // Skip if alerts are disabled
    if (!config.dueDate.showDueTodayAlert) {
      return;
    }
    
    // Helper function to find all relevant todos in the tree
    const findDueTodos = (items: TodoItem[]): TodoItem[] => {
      let result: TodoItem[] = [];
      
      const traverse = (todoItems: TodoItem[]) => {
        todoItems.forEach(todo => {
          // Only include uncompleted todos with due dates
          if (!todo.completed && todo.dueDate) {
            // Check if due today or within the alert days
            if (isDueToday(todo.dueDate) || 
                (config.dueDate.alertDays > 0 && isWithinDays(todo.dueDate, config.dueDate.alertDays))) {
              result.push(todo);
            }
          }
          
          // Continue traversing children
          if (todo.children.length > 0) {
            traverse(todo.children);
          }
        });
      };
      
      traverse(items);
      return result;
    };
    
    const dueTodos = findDueTodos(todos);
    setDueTodayItems(dueTodos);
    
    // Show the alert if there are todos due today or soon
    if (dueTodos.length > 0) {
      setOpen(true);
    }
  }, [todos, config.dueDate.showDueTodayAlert, config.dueDate.alertDays]);

  // Navigate to a specific todo when clicked
  const handleTodoClick = (todoId: string) => {
    expandTodo(todoId);
    setOpen(false);
    
    // Scroll to the todo
    setTimeout(() => {
      const element = document.getElementById(`todo-item-${todoId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add a temporary highlight effect
        element.classList.add('bg-primary/20');
        setTimeout(() => {
          element.classList.remove('bg-primary/20');
        }, 2000);
      }
    }, 100);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {dueTodayItems.length} {dueTodayItems.length === 1 ? 'todo' : 'todos'} need attention
          </AlertDialogTitle>
          <AlertDialogDescription>
            The following {dueTodayItems.length === 1 ? 'task is' : 'tasks are'} due today or coming up soon:
          </AlertDialogDescription>
          <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto">
            {dueTodayItems.map(todo => (
              <div 
                key={todo.id}
                className="p-2 rounded-md bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => handleTodoClick(todo.id)}
              >
                {todo.text}
              </div>
            ))}
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Dismiss</AlertDialogCancel>
          <AlertDialogAction onClick={() => setOpen(false)}>
            Got it
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};