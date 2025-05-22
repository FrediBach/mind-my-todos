import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { parseSmartDate, formatDueDate, getDueDateUrgency, getDueDateColorClass, getRelativeDueDate } from '@/util/dateUtils';
import { isAfter } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTodoParent } from '@/hooks/useTodoParent';

interface DueDatePickerProps {
  dueDate: Date | null;
  onChange: (date: Date | null) => void;
  className?: string;
  disabled?: boolean;
  todoId?: string; // Optional todoId to check for parent constraints
}

export function DueDatePicker({ dueDate, onChange, className, disabled = false, todoId }: DueDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [showParentWarning, setShowParentWarning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Use our custom hook to get the parent's due date
  const { parentDueDate } = useTodoParent(todoId);
  
  // Update input value when dueDate changes
  useEffect(() => {
    if (dueDate) {
      setInputValue(formatDueDate(dueDate));
    } else {
      setInputValue('');
    }
  }, [dueDate]);
  
  // Focus input when showInput becomes true
  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const parsedDate = parseSmartDate(inputValue);
      if (parsedDate) {
        // Check if date is after parent's due date
        if (parentDueDate && isAfter(parsedDate, parentDueDate)) {
          setShowParentWarning(true);
          return;
        }
        onChange(parsedDate);
        setShowInput(false);
        setShowParentWarning(false);
      }
    } else if (e.key === 'Escape') {
      setShowInput(false);
      setInputValue(dueDate ? formatDueDate(dueDate) : '');
      setShowParentWarning(false);
    }
  };
  
  const handleInputBlur = () => {
    const parsedDate = parseSmartDate(inputValue);
    if (parsedDate) {
      // Check if date is after parent's due date
      if (parentDueDate && isAfter(parsedDate, parentDueDate)) {
        setShowParentWarning(true);
        return;
      }
      onChange(parsedDate);
      setShowParentWarning(false);
    } else if (inputValue.trim() === '') {
      onChange(null);
      setShowParentWarning(false);
    } else {
      // Reset to current value if parsing failed
      setInputValue(dueDate ? formatDueDate(dueDate) : '');
      setShowParentWarning(false);
    }
    setShowInput(false);
  };
  
  const handleClearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setOpen(false);
  };
  
  const urgency = getDueDateUrgency(dueDate);
  const colorClass = getDueDateColorClass(urgency);
  const relativeDate = getRelativeDueDate(dueDate);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {dueDate ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-7 px-2 text-xs font-normal",
                      colorClass,
                      disabled && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={disabled}
                    onClick={() => !disabled && setOpen(true)}
                  >
                    <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                    <span>{relativeDate}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{formatDueDate(dueDate)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : showInput ? (
            <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                onBlur={handleInputBlur}
                placeholder="e.g., in 3 days"
                className="h-7 w-[150px] text-xs"
                disabled={disabled}
              />
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-7 px-2 text-xs font-normal",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              disabled={disabled}
              onClick={() => !disabled && setShowInput(true)}
            >
              <CalendarIcon className="mr-1 h-3.5 w-3.5" />
              <span>Add due date</span>
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-2 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Set due date</div>
              {dueDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={handleClearDate}
                >
                  <X className="h-4 w-4" />
                  <span className="ml-1">Clear</span>
                </Button>
              )}
            </div>
            <Input
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              placeholder="e.g., in 3 days, next week"
              className="h-8"
            />
            <div className="text-xs text-muted-foreground">
              Try: "tomorrow", "in 3 days", "next week", "in about a month"
            </div>
          </div>
          {parentDueDate && (
            <Alert className="bg-blue-500/10 mb-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Parent todo is due on {formatDueDate(parentDueDate)}
              </AlertDescription>
            </Alert>
          )}
          
          {showParentWarning && (
            <Alert variant="destructive" className="mb-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Due date cannot be later than the parent's due date
              </AlertDescription>
            </Alert>
          )}
          
          <Calendar
            mode="single"
            selected={dueDate || undefined}
            onSelect={(date) => {
              if (date) {
                // Check if date is after parent's due date
                if (parentDueDate && isAfter(date, parentDueDate)) {
                  setShowParentWarning(true);
                  return;
                }
              }
              onChange(date || null);
              setOpen(false);
              setShowParentWarning(false);
            }}
            disabled={(date) => parentDueDate ? isAfter(date, parentDueDate) : false}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      
      {dueDate && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
          onClick={handleClearDate}
          disabled={disabled}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}