import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { parseSmartDate, formatDueDate } from '@/util/dateUtils';
import { addDays, addWeeks, addMonths, isBefore, startOfDay, isAfter } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useTodoParent } from '@/hooks/useTodoParent';

interface DueDateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dueDate: Date | null;
  onSave: (date: Date | null) => void;
  todoId?: string; // Optional todoId to check for parent constraints
}

export function DueDateDialog({ isOpen, onClose, dueDate, onSave, todoId }: DueDateDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(dueDate);
  const [inputValue, setInputValue] = useState('');
  const [showParentWarning, setShowParentWarning] = useState(false);
  const today = startOfDay(new Date());
  
  // Use our custom hook to get the parent's due date
  const { parentDueDate } = useTodoParent(todoId);

  // Update input value when dueDate changes
  useEffect(() => {
    if (dueDate) {
      setSelectedDate(dueDate);
      setInputValue(formatDueDate(dueDate));
    } else {
      setSelectedDate(null);
      setInputValue('');
    }
  }, [dueDate, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowParentWarning(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const parsedDate = parseSmartDate(inputValue);
      if (parsedDate && !isBefore(parsedDate, today)) {
        // Check if date is after parent's due date
        if (parentDueDate && isAfter(parsedDate, parentDueDate)) {
          setShowParentWarning(true);
          return;
        }
        
        setSelectedDate(parsedDate);
        setShowParentWarning(false);
      } else if (inputValue.trim() === '') {
        setSelectedDate(null);
        setShowParentWarning(false);
      }
    }
  };

  const handleQuickDate = (date: Date | null) => {
    // Check if date is after parent's due date
    if (date && parentDueDate && isAfter(date, parentDueDate)) {
      setShowParentWarning(true);
      return;
    }
    
    setSelectedDate(date);
    setShowParentWarning(false);
    
    if (date) {
      setInputValue(formatDueDate(date));
    } else {
      setInputValue('');
    }
  };

  const handleSave = () => {
    // If there's text in the input, try to parse it first
    if (inputValue.trim() !== '' && !selectedDate) {
      const parsedDate = parseSmartDate(inputValue);
      if (parsedDate && !isBefore(parsedDate, today)) {
        // Check if date is after parent's due date
        if (parentDueDate && isAfter(parsedDate, parentDueDate)) {
          setShowParentWarning(true);
          return;
        }
        
        onSave(parsedDate);
      } else {
        // Invalid date or date in the past
        onSave(selectedDate);
      }
    } else {
      onSave(selectedDate);
    }
    onClose();
  };

  const handleClear = () => {
    setSelectedDate(null);
    setInputValue('');
    setShowParentWarning(false);
  };

  // Function to check if a date is disabled in the calendar
  const isDateDisabled = (date: Date) => {
    // Disable dates in the past
    if (isBefore(date, today)) return true;
    
    // Disable dates after parent's due date if it exists
    if (parentDueDate && isAfter(date, parentDueDate)) return true;
    
    return false;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Due Date</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          {parentDueDate && (
            <Alert className="bg-blue-500/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Parent todo is due on {formatDueDate(parentDueDate)}. Subtasks cannot be due after this date.
              </AlertDescription>
            </Alert>
          )}
          
          {showParentWarning && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Due date cannot be later than the parent's due date.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col gap-2">
            <Input
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              placeholder="e.g., tomorrow, in 3 days, next week"
              className="w-full"
            />
            <div className="text-xs text-muted-foreground">
              Try: "tomorrow", "in 3 days", "next week", "in about a month"
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleQuickDate(today)}
              className="text-xs"
            >
              Today
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleQuickDate(addDays(today, 1))}
              className="text-xs"
            >
              Tomorrow
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleQuickDate(addDays(today, 2))}
              className="text-xs"
            >
              In 2 days
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleQuickDate(addDays(today, 3))}
              className="text-xs"
            >
              In 3 days
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleQuickDate(addWeeks(today, 1))}
              className="text-xs"
            >
              Next week
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleQuickDate(addMonths(today, 1))}
              className="text-xs"
            >
              Next month
            </Button>
          </div>
          
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate || undefined}
              onSelect={(date) => handleQuickDate(date || null)}
              disabled={isDateDisabled}
              initialFocus
            />
          </div>
        </div>
        
        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button 
              variant="outline" 
              onClick={handleClear}
              disabled={!selectedDate}
            >
              Clear
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={showParentWarning}>
                Save
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DueDateDialog;