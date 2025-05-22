import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import { useTodoContext } from '@/contexts/TodoContext';

const ClearAllDialog: React.FC = () => {
  const { clearAllTodos, clearCheckedTodos } = useTodoContext();
  const [clearOnlyChecked, setClearOnlyChecked] = useState(false);

  const handleClear = () => {
    if (clearOnlyChecked) {
      clearCheckedTodos();
    } else {
      clearAllTodos();
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" title="Clear todos">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {clearOnlyChecked ? "Clear checked todos?" : "Clear all todos?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {clearOnlyChecked 
              ? "This action will remove all checked todos from your list. You can use the undo button to restore them if needed."
              : "This action will remove all todos from your list. You can use the undo button to restore them if needed."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="flex items-center space-x-2 py-4">
          <Checkbox 
            id="clear-checked-only" 
            checked={clearOnlyChecked} 
            onCheckedChange={(checked) => setClearOnlyChecked(checked === true)}
          />
          <Label htmlFor="clear-checked-only" className="cursor-pointer">
            Only clear checked todos
          </Label>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleClear}>
            {clearOnlyChecked ? "Clear Checked" : "Clear All"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ClearAllDialog;