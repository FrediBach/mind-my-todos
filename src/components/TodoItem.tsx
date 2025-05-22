import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { TimerStatus } from '@/contexts/TimeTrackingContext';
import { useTimeTrackingSafe, useTodoContextSafe } from '@/hooks/useContextSafe';
import { getTodoStats } from '@/util/todoStats';
import { TimeDisplay } from '@/components/ui/time-display';
import { ProgressWithText } from '@/components/ui/progress-with-text';
import { 
  ChevronRight, 
  ChevronDown, 
  Trash, 
  Copy, 
  Plus, 
  Import, 
  Scissors, 
  MessageSquare,
  MoreHorizontal,
  Merge,
  Bookmark,
  ArrowDownAZ,
  ArrowUpZA,
  Sparkles,
  Split,
  Calendar,
  Pin,
  Clock,
  DollarSign,
  Link,
  ExternalLink,
  Bold,
  Italic,
  Strikethrough,
  ChevronUp,
  ChevronsUp,
  ChevronDown as ChevronDownIcon,
  ChevronsDown,
  Flag,
  Ruler
} from 'lucide-react';
import { TodoItem as TodoItemType, useTodoContext } from '@/contexts/TodoContext';
import ImportDialog from './ImportDialog';
import { NoteDialog } from './NoteDialog';
import SplitToNewListDialog from './SplitToNewListDialog';
import CostDialog from './CostDialog';
import TimeEstimateDialog from './TimeEstimateDialog';
import StoryPointDialog from './StoryPointDialog';
import ListReferenceDialog from './ListReferenceDialog';
import CustomMetricDialog from './CustomMetricDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ReactMarkdown from 'react-markdown';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from '@/components/ui/context-menu';
import { useTextSize } from './TextSizeProvider';
import { cn } from '@/lib/utils';
import { convertEmoticonsToEmojis } from '@/util/string';
import { HighlightedMarkdown } from './HighlightedMarkdown';
import { LlmActionsButton } from './LlmActionsButton';
import { DueDateDialog } from './DueDateDialog';
import { MarkdownToolbar } from './MarkdownToolbar';

interface TodoItemProps {
  todo: TodoItemType;
  level: number;
  isDragging?: boolean;
}

// Import time formatting utilities
import { formatTime, formatTimeShort } from '@/util/time';
import { formatDateNaturally, getDueDateUrgency, getDueDateColorClass, formatDueDate, formatCountdown } from '@/util/dateUtils';
import { differenceInDays } from 'date-fns';

const TodoItem: React.FC<TodoItemProps> = ({ todo, level, isDragging = false }) => {
  const { toggleTodo, editTodo, removeTodo, toggleCollapse, duplicateTodo, combineTodo, addTodo, splitTodo, lastModifiedTodoId, searchQuery, toggleBookmark, sortChildrenAscending, sortChildrenDescending, setDueDate, togglePinned, bookmarkedTodoId, setLinkedList, getLinkedListStats, setPriority } = useTodoContext();
  const { textSize } = useTextSize();
  
  // Safely access TimeTrackingContext
  const timeTracking = useTimeTrackingSafe();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChildText, setNewChildText] = useState('');
  const [isSplitting, setIsSplitting] = useState(false);
  const [isInitialEditSetup, setIsInitialEditSetup] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isDueDateDialogOpen, setIsDueDateDialogOpen] = useState(false);
  const [isCostDialogOpen, setIsCostDialogOpen] = useState(false);
  const [isTimeEstimateDialogOpen, setIsTimeEstimateDialogOpen] = useState(false);
  const [isStoryPointDialogOpen, setIsStoryPointDialogOpen] = useState(false);
  const [isListReferenceDialogOpen, setIsListReferenceDialogOpen] = useState(false);
  const [isCustomMetricDialogOpen, setIsCustomMetricDialogOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggle = () => {
    // Always add the current elapsed time when checking a todo
    // This ensures any todo that's checked gets the current timer value
    if (timeTracking.elapsedTime > 0 && timeTracking.timerStatus !== 'idle') {
      toggleTodo(todo.id, timeTracking.elapsedTime);
      // Reset the timer after adding the time
      timeTracking.resetTimer();
    } else {
      toggleTodo(todo.id);
    }
  };

  // Calculate approximate cursor position based on click coordinates
  const calculateClickPosition = (e: React.MouseEvent, text: string) => {
    const textElement = e.currentTarget as HTMLElement;
    const textRect = textElement.getBoundingClientRect();
    const clickX = e.clientX - textRect.left;
    
    // Get the computed style to determine font properties
    const style = window.getComputedStyle(textElement);
    const fontFamily = style.fontFamily;
    const fontSize = parseFloat(style.fontSize);
    
    // Create a temporary span to measure text width
    const span = document.createElement('span');
    span.style.font = `${fontSize}px ${fontFamily}`;
    span.style.position = 'absolute';
    span.style.visibility = 'hidden';
    document.body.appendChild(span);
    
    // Binary search to find the closest character position
    let left = 0;
    let right = text.length;
    
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      span.textContent = text.substring(0, mid);
      const width = span.offsetWidth;
      
      if (width < clickX) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    
    // Clean up
    document.body.removeChild(span);
    
    // Return the estimated position
    return Math.min(left, text.length);
  };

  // Start editing when clicking on the text
  const handleStartEdit = (e: React.MouseEvent) => {
    const clickPosition = calculateClickPosition(e, todo.text);
    setIsEditing(true);
    setEditText(todo.text);
    setIsInitialEditSetup(true);
    setCursorPosition(clickPosition);
  };
  
  // Update cursor position when input is focused, but only during initial setup
  useEffect(() => {
    if (isEditing && inputRef.current && isInitialEditSetup) {
      // Set cursor at the clicked position
      inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      setIsInitialEditSetup(false);
    }
  }, [isEditing, isInitialEditSetup, cursorPosition]);

  const handleSaveEdit = () => {
    if (editText.trim()) {
      editTodo(todo.id, editText);
    }
    setIsEditing(false);
    setIsSplitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setIsSplitting(false);
      setEditText(todo.text);
    }
  };
  
  // Track cursor position while editing
  const handleCursorPositionChange = () => {
    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart || 0);
    }
  };
  
  const handleSplitTodo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Use the tracked cursor position instead of trying to get it at click time
    if (cursorPosition > 0 && cursorPosition < editText.length) {
      splitTodo(todo.id, cursorPosition);
      setIsEditing(false);
      setIsSplitting(false);
    }
  };

  // Handle blur with a slight delay to allow split button click to register
  const handleBlur = (e: React.FocusEvent) => {
    // If we're in the process of splitting, don't save yet
    if (isSplitting) return;
    
    // Check if the related target is one of our formatting buttons
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && 
        (relatedTarget.closest('.editing-toolbar-button') || 
         relatedTarget.tagName === 'BUTTON')) {
      // If focus moved to a toolbar button, don't save yet
      return;
    }
    
    // Use setTimeout to delay the blur handling
    // This gives time for split button click to register if that's what was clicked
    setTimeout(() => {
      if (!isSplitting) {
        handleSaveEdit();
      }
    }, 100);
  };

  const handleAddChild = () => {
    if (newChildText.trim()) {
      addTodo(newChildText, todo.id);
      setNewChildText('');
      setShowAddChild(false);
      
      // Ensure parent is uncollapsed when adding a child
      if (todo.collapsed) {
        toggleCollapse(todo.id);
      }
    }
  };

  const handleAddChildKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddChild();
    } else if (e.key === 'Escape') {
      setShowAddChild(false);
      setNewChildText('');
    }
  };

  // Calculate statistics for this branch
  const stats = getTodoStats(todo, getLinkedListStats);
  const hasChildren = todo.children.length > 0;

  // Determine if this todo is the last modified one
  const isLastModified = todo.id === lastModifiedTodoId;
  
  // Get background color class based on note color
  const getNoteColorClass = (color?: string) => {
    switch (color) {
      case 'red':
        return 'bg-red-50 dark:bg-red-950/50';
      case 'orange':
        return 'bg-orange-50 dark:bg-orange-950/50';
      case 'green':
        return 'bg-green-50 dark:bg-green-950/50';
      case 'blue':
        return 'bg-blue-50 dark:bg-blue-950/50';
      default:
        return '';
    }
  };

  // Get icon color class based on note color
  const getNoteIconColorClass = (color?: string) => {
    switch (color) {
      case 'red':
        return 'text-red-500 dark:text-red-400';
      case 'orange':
        return 'text-orange-500 dark:text-orange-400';
      case 'green':
        return 'text-green-500 dark:text-green-400';
      case 'blue':
        return 'text-blue-500 dark:text-blue-400';
      default:
        return 'text-red-500 dark:text-red-400';
    }
  };
  
  // Get priority icon based on priority level
  const getPriorityIcon = () => {
    switch (todo.priority) {
      case 'blocker':
        return <ChevronsUp size={14} className="text-red-600 dark:text-red-500" />;
      case 'important':
        return <ChevronUp size={14} className="text-amber-600 dark:text-amber-500" />;
      case 'low':
        return <ChevronDownIcon size={14} className="text-blue-600 dark:text-blue-500" />;
      case 'lowest':
        return <ChevronsDown size={14} className="text-gray-600 dark:text-gray-500" />;
      default:
        return null;
    }
  };
  
  // Get priority color class based on priority level
  const getPriorityColorClass = () => {
    switch (todo.priority) {
      case 'blocker':
        return 'text-red-600 dark:text-red-500';
      case 'important':
        return 'text-amber-600 dark:text-amber-500';
      case 'low':
        return 'text-blue-600 dark:text-blue-500';
      case 'lowest':
        return 'text-gray-600 dark:text-gray-500';
      default:
        return '';
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <motion.div 
          className={`todo-item ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} relative`}
          initial={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
          transition={{ duration: 0.2 }}
          id={`todo-item-${todo.id}`}>
      <div 
        className={cn(
          "flex items-center gap-2 py-1 group rounded-md",
          isLastModified ? 'bg-primary/10 animate-pulse-subtle' : '',
          todo.note && todo.noteColor ? getNoteColorClass(todo.noteColor) : '',
          todo.bookmarked ? 'relative border-l-4 border-red-500 before:content-[""] before:absolute before:top-0 before:left-0 before:w-3 before:h-3 before:bg-red-500 before:rounded-br-md' : ''
        )}
      >
        {hasChildren && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0"
            onClick={() => toggleCollapse(todo.id)}
          >
            {todo.collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </Button>
        )}
        
        {!hasChildren && <div className="w-5" />}
        
        <motion.div
          whileTap={{ scale: 0.9 }}
        >
          <Checkbox
            checked={todo.completed}
            onCheckedChange={handleToggle}
            id={`todo-${todo.id}`}
          />
        </motion.div>
        
        {!isEditing && todo.dueDate && !todo.completed && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "flex items-center gap-1 text-xs",
                  getDueDateColorClass(getDueDateUrgency(todo.dueDate)),
                  differenceInDays(todo.dueDate, new Date()) < 7 ? "text-red-500 dark:text-red-400" : ""
                )}>
                  <Clock size={14} />
                  <span>
                    {formatCountdown(todo.dueDate) || formatDateNaturally(todo.dueDate)}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Due: {formatDueDate(todo.dueDate)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {isEditing ? (
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onKeyUp={handleCursorPositionChange}
                onClick={handleCursorPositionChange}
                onMouseUp={handleCursorPositionChange}
                className="flex-1"
                autoFocus
              />
              <TooltipProvider>
                {/* Markdown formatting buttons */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7 editing-toolbar-button" 
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent focus loss
                        const start = inputRef.current?.selectionStart || 0;
                        const end = inputRef.current?.selectionEnd || 0;
                        const selectedText = editText.substring(start, end);
                        const newText = 
                          editText.substring(0, start) + 
                          `**${selectedText || ''}**` + 
                          editText.substring(end);
                        setEditText(newText);
                        
                        // Set cursor position after update
                        setTimeout(() => {
                          if (inputRef.current) {
                            const newPos = selectedText ? start + 2 + selectedText.length + 2 : start + 2;
                            inputRef.current.focus();
                            inputRef.current.setSelectionRange(newPos, newPos);
                          }
                        }, 0);
                      }}
                      type="button"
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Bold</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7 editing-toolbar-button" 
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent focus loss
                        const start = inputRef.current?.selectionStart || 0;
                        const end = inputRef.current?.selectionEnd || 0;
                        const selectedText = editText.substring(start, end);
                        const newText = 
                          editText.substring(0, start) + 
                          `*${selectedText || ''}*` + 
                          editText.substring(end);
                        setEditText(newText);
                        
                        // Set cursor position after update
                        setTimeout(() => {
                          if (inputRef.current) {
                            const newPos = selectedText ? start + 1 + selectedText.length + 1 : start + 1;
                            inputRef.current.focus();
                            inputRef.current.setSelectionRange(newPos, newPos);
                          }
                        }, 0);
                      }}
                      type="button"
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Italic</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7 editing-toolbar-button" 
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent focus loss
                        const start = inputRef.current?.selectionStart || 0;
                        const end = inputRef.current?.selectionEnd || 0;
                        const selectedText = editText.substring(start, end);
                        const newText = 
                          editText.substring(0, start) + 
                          `~~${selectedText || ''}~~` + 
                          editText.substring(end);
                        setEditText(newText);
                        
                        // Set cursor position after update
                        setTimeout(() => {
                          if (inputRef.current) {
                            const newPos = selectedText ? start + 2 + selectedText.length + 2 : start + 2;
                            inputRef.current.focus();
                            inputRef.current.setSelectionRange(newPos, newPos);
                          }
                        }, 0);
                      }}
                      type="button"
                    >
                      <Strikethrough className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Strikethrough</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7 editing-toolbar-button" 
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent focus loss
                        const start = inputRef.current?.selectionStart || 0;
                        const end = inputRef.current?.selectionEnd || 0;
                        const selectedText = editText.substring(start, end);
                        const newText = 
                          editText.substring(0, start) + 
                          `[${selectedText || ''}](https://example.com)` + 
                          editText.substring(end);
                        setEditText(newText);
                        
                        // Set cursor position after update
                        setTimeout(() => {
                          if (inputRef.current) {
                            const newPos = selectedText 
                              ? start + selectedText.length + 3 // Position after the closing bracket
                              : start + 1; // Position after the opening bracket
                            inputRef.current.focus();
                            inputRef.current.setSelectionRange(newPos, newPos);
                          }
                        }, 0);
                      }}
                      type="button"
                    >
                      <Link className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Insert Link</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 editing-toolbar-button"
                      onClick={handleSplitTodo}
                      onMouseDown={() => setIsSplitting(true)}
                      disabled={!editText || editText.length <= 1 || cursorPosition <= 0 || cursorPosition >= editText.length}
                    >
                      <Scissors size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Split todo at cursor position</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center overflow-hidden">
            {todo.priority && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="mr-1.5">
                      {getPriorityIcon()}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className={getPriorityColorClass()}>
                      {todo.priority === 'blocker' && 'Blocker'}
                      {todo.priority === 'important' && 'Important'}
                      {todo.priority === 'low' && 'Less important'}
                      {todo.priority === 'lowest' && 'Least important'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div 
                    className={`flex-1 cursor-text overflow-hidden ${todo.completed ? 'line-through text-muted-foreground' : ''}`}
                    onClick={(e) => handleStartEdit(e)}
                    animate={{
                      opacity: todo.completed ? 0.7 : 1,
                      scale: todo.completed ? 0.98 : 1
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <HighlightedMarkdown
                      text={todo.text}
                      searchTerm={searchQuery}
                      className="w-full"
                      inline={true}
                      truncate={true}
                    />
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent className="max-w-md">
                  <HighlightedMarkdown
                    text={todo.text}
                    searchTerm={searchQuery}
                    className="break-words"
                  />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        
        {hasChildren && !isEditing && (
          <div className="flex items-center gap-2">
            <div className="min-w-[60px] w-[60px]">
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                key={`progress-${stats.completionPercentage}`}
              >
                <ProgressWithText 
                  value={stats.completionPercentage} 
                  total={stats.total} 
                  completed={stats.completed} 
                  size="sm" 
                />
              </motion.div>
            </div>
            
            {/* Display cumulative time for todos with children */}
            {stats.cumulativeTimeSpent > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <TimeDisplay 
                        seconds={stats.cumulativeTimeSpent} 
                        showIcon={false} 
                        size="sm" 
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total time: {formatTime(stats.cumulativeTimeSpent)}</p>
                    {todo.timeSpent && todo.timeSpent > 0 && (
                      <p>This task only: {formatTime(todo.timeSpent)}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
        
        {!hasChildren && !isEditing && todo.timeSpent && todo.timeSpent > 0 && (
          <TimeDisplay 
            seconds={todo.timeSpent} 
            showIcon={false} 
            size="sm" 
            className="ml-2" 
          />
        )}
        
        {!isEditing && todo.note && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-2">
                  <MessageSquare 
                    size={14} 
                    className={getNoteIconColorClass(todo.noteColor)} 
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent className={cn("max-w-md", todo.noteColor ? getNoteColorClass(todo.noteColor) : '')}>
                <HighlightedMarkdown
                  text={todo.note || ''}
                  searchTerm={searchQuery}
                  className="break-words"
                />
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {!isEditing && todo.pinned && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-2">
                  <Pin 
                    size={14} 
                    className="text-primary fill-primary rotate-45" 
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Pinned todo</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {/* Display cost if set */}
        {!isEditing && (todo.cost !== undefined && todo.cost !== null) && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "ml-2 flex items-center gap-1 text-green-500 dark:text-green-400",
                  todo.completed ? "line-through opacity-70" : ""
                )}>
                  <DollarSign size={14} />
                  <span>{todo.cost.toFixed(2)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{todo.completed ? "Paid cost" : "Cost"}: ${todo.cost.toFixed(2)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {/* Display time estimate if set */}
        {!isEditing && (todo.timeEstimate !== undefined && todo.timeEstimate !== null) && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "ml-2 flex items-center gap-1 text-purple-500 dark:text-purple-400",
                  todo.completed ? "line-through opacity-70" : ""
                )}>
                  <Clock size={14} />
                  <span>est. {formatTimeShort(todo.timeEstimate)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Time estimate: {formatTime(todo.timeEstimate)}</p>
                {todo.timeSpent !== undefined && todo.timeSpent > 0 && (
                  <>
                    <p>Time spent: {formatTime(todo.timeSpent)}</p>
                    <p>Efficiency: {Math.round((todo.timeSpent / todo.timeEstimate) * 100)}%</p>
                    <p>{todo.timeSpent < todo.timeEstimate ? "Faster than estimated! 🎉" : "Slower than estimated"}</p>
                  </>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {/* Display story points if set */}
        {!isEditing && (todo.storyPoints !== undefined && todo.storyPoints !== null) && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "ml-2 flex items-center gap-1 text-amber-500 dark:text-amber-400",
                  todo.completed ? "line-through opacity-70" : ""
                )}>
                  <Sparkles size={14} />
                  <span>{todo.storyPoints}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Story points: {todo.storyPoints}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Represents relative complexity, not time
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {/* Display custom metrics if set */}
        {!isEditing && (
          <>
            {/* Display from new customMetrics array */}
            {todo.customMetrics && todo.customMetrics.length > 0 && todo.customMetrics.map((metric, index) => (
              <TooltipProvider key={`${metric.unit}-${index}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "ml-2 flex items-center gap-1 text-amber-700 dark:text-amber-600",
                      todo.completed ? "line-through opacity-70" : ""
                    )}>
                      <Ruler size={14} />
                      <span>{metric.value} {metric.unit}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Custom metric: {metric.value} {metric.unit}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            
            {/* Legacy support for old format */}
            {!todo.customMetrics && todo.customMetricValue !== undefined && todo.customMetricValue !== null && todo.customMetricUnit && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "ml-2 flex items-center gap-1 text-amber-700 dark:text-amber-600",
                      todo.completed ? "line-through opacity-70" : ""
                    )}>
                      <Ruler size={14} />
                      <span>{todo.customMetricValue} {todo.customMetricUnit}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Custom metric: {todo.customMetricValue} {todo.customMetricUnit}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </>
        )}
        
        {/* Display cumulative cost for parent todos */}
        {!isEditing && hasChildren && (stats.cumulativeCost > 0 || stats.paidCost > 0) && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-2 flex items-center gap-1 text-blue-500 dark:text-blue-400">
                  <DollarSign size={14} />
                  <span>{(stats.cumulativeCost + stats.paidCost).toFixed(2)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total cost: ${(stats.cumulativeCost + stats.paidCost).toFixed(2)}</p>
                {todo.cost && todo.cost > 0 && (
                  <p>This task only: ${todo.cost.toFixed(2)}</p>
                )}
                {stats.paidCost > 0 && (
                  <p>Paid: ${stats.paidCost.toFixed(2)}</p>
                )}
                {stats.unpaidCost > 0 && (
                  <p>Unpaid: ${stats.unpaidCost.toFixed(2)}</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {/* Display cumulative time estimate for parent todos */}
        {!isEditing && hasChildren && stats.cumulativeTimeEstimate > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-2 flex items-center gap-1 text-indigo-500 dark:text-indigo-400">
                  <Clock size={14} />
                  <span>est. {formatTimeShort(stats.cumulativeTimeEstimate)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total time estimate: {formatTime(stats.cumulativeTimeEstimate)}</p>
                {todo.timeEstimate && todo.timeEstimate > 0 && (
                  <p>This task only: {formatTime(todo.timeEstimate)}</p>
                )}
                {stats.cumulativeTimeSpent > 0 && (
                  <>
                    <p>Total time spent: {formatTime(stats.cumulativeTimeSpent)}</p>
                    <p>Efficiency: {Math.round((stats.cumulativeTimeSpent / stats.cumulativeTimeEstimate) * 100)}%</p>
                    <p>{stats.timeEfficiency < 1 ? "Faster than estimated! 🎉" : "Slower than estimated"}</p>
                  </>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {/* Display cumulative story points for parent todos */}
        {!isEditing && hasChildren && stats.cumulativeStoryPoints > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-2 flex items-center gap-1 text-amber-500 dark:text-amber-400">
                  <Sparkles size={14} />
                  <span>{stats.cumulativeStoryPoints}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total story points: {stats.cumulativeStoryPoints}</p>
                {todo.storyPoints && todo.storyPoints > 0 && (
                  <p>This task only: {todo.storyPoints}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Represents total complexity of this branch
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {/* Display cumulative custom metrics for parent todos */}
        {!isEditing && hasChildren && stats.customMetrics && Object.keys(stats.customMetrics).length > 0 && (
          <>
            {Object.entries(stats.customMetrics).map(([unit, value]) => (
              <TooltipProvider key={unit}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="ml-2 flex items-center gap-1 text-amber-700 dark:text-amber-600">
                      <Ruler size={14} />
                      <span>{value} {unit}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total {unit}: {value}</p>
                    {/* Check in customMetrics array first */}
                    {todo.customMetrics && todo.customMetrics.find(m => m.unit === unit) && (
                      <p>This task only: {todo.customMetrics.find(m => m.unit === unit)?.value} {unit}</p>
                    )}
                    {/* Legacy support */}
                    {!todo.customMetrics && todo.customMetricUnit === unit && todo.customMetricValue !== null && todo.customMetricValue !== undefined && (
                      <p>This task only: {todo.customMetricValue} {unit}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </>
        )}
        
        {/* Display linked list indicator and stats */}
        {!isEditing && todo.linkedListId && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-2 flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <ExternalLink size={14} />
                  <span>Linked List</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {(() => {
                  const linkedStats = getLinkedListStats(todo.linkedListId as string);
                  if (!linkedStats) return <p>Linked list not found</p>;
                  
                  return (
                    <div className="space-y-1">
                      <p className="font-medium">Linked Todo List</p>
                      <p>Completion: {linkedStats.completionPercentage}% ({linkedStats.completed}/{linkedStats.total})</p>
                      {linkedStats.cumulativeCost > 0 && (
                        <p>Total cost: ${(linkedStats.cumulativeCost + linkedStats.paidCost).toFixed(2)}</p>
                      )}
                      {linkedStats.cumulativeTimeEstimate > 0 && (
                        <p>Time estimate: {formatTime(linkedStats.cumulativeTimeEstimate)}</p>
                      )}
                      {linkedStats.cumulativeTimeSpent > 0 && (
                        <p>Time spent: {formatTime(linkedStats.cumulativeTimeSpent)}</p>
                      )}
                    </div>
                  );
                })()}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {!isEditing && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <LlmActionsButton todoId={todo.id} />
          </div>
        )}
        
      </div>
      
      {showAddChild && (
        <div className="flex items-center gap-2 py-1" style={{ marginLeft: '24px' }}>
          <div className="w-5" />
          <Checkbox disabled />
          <Input
            value={newChildText}
            onChange={(e) => setNewChildText(e.target.value)}
            onBlur={() => newChildText.trim() ? handleAddChild() : setShowAddChild(false)}
            onKeyDown={handleAddChildKeyDown}
            placeholder="Add a subtask..."
            className="flex-1"
            autoFocus
          />
        </div>
      )}
      
      {/* Note Dialog */}
      <NoteDialog
        todoId={todo.id}
        isOpen={isNoteDialogOpen}
        onClose={() => setIsNoteDialogOpen(false)}
        initialNote={todo.note || ''}
        initialColor={todo.noteColor}
      />
      
      {/* Due Date Dialog */}
      <DueDateDialog
        isOpen={isDueDateDialogOpen}
        onClose={() => setIsDueDateDialogOpen(false)}
        dueDate={todo.dueDate || null}
        onSave={(date) => setDueDate(todo.id, date)}
        todoId={todo.id}
      />
      
      {/* Cost Dialog */}
      <CostDialog
        isOpen={isCostDialogOpen}
        onClose={() => setIsCostDialogOpen(false)}
        todoId={todo.id}
        initialCost={todo.cost || null}
      />
      
      {/* Time Estimate Dialog */}
      <TimeEstimateDialog
        isOpen={isTimeEstimateDialogOpen}
        onClose={() => setIsTimeEstimateDialogOpen(false)}
        todoId={todo.id}
        initialTimeEstimate={todo.timeEstimate || null}
      />
      
      {/* Story Point Dialog */}
      <StoryPointDialog
        isOpen={isStoryPointDialogOpen}
        onClose={() => setIsStoryPointDialogOpen(false)}
        todoId={todo.id}
        initialStoryPoints={todo.storyPoints || null}
      />
      
      {/* List Reference Dialog */}
      <ListReferenceDialog
        isOpen={isListReferenceDialogOpen}
        onClose={() => setIsListReferenceDialogOpen(false)}
        todoId={todo.id}
        initialLinkedListId={todo.linkedListId || null}
      />
      
      {/* Custom Metric Dialog */}
      <CustomMetricDialog
        isOpen={isCustomMetricDialogOpen}
        onClose={() => setIsCustomMetricDialogOpen(false)}
        todoId={todo.id}
        initialValue={todo.customMetricValue || null}
        initialUnit={todo.customMetricUnit || null}
      />
      
      {/* Children are now rendered in DraggableTodoItem */}
    </motion.div>
      </ContextMenuTrigger>
      
      <ContextMenuContent className="w-56">
        {/* Group 1: Primary Actions */}
        <ContextMenuItem 
          onClick={() => toggleBookmark(todo.id)}
          className="cursor-pointer"
        >
          <Bookmark className={cn("mr-2 h-4 w-4", todo.bookmarked ? "fill-red-500 text-red-500" : "")} />
          <span>{todo.bookmarked ? "Remove bookmark" : bookmarkedTodoId ? "Move bookmark" : "Add bookmark"}</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => togglePinned(todo.id)}
          className="cursor-pointer"
        >
          <Pin className={cn("mr-2 h-4 w-4", todo.pinned ? "fill-primary text-primary rotate-45" : "")} />
          <span>{todo.pinned ? "Unpin todo" : "Pin todo"}</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => setShowAddChild(true)}
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span>Add subtask</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => setIsNoteDialogOpen(true)}
          className="cursor-pointer"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          <span>{todo.note ? "Edit note" : "Add note"}</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => setIsDueDateDialogOpen(true)}
          className="cursor-pointer"
        >
          <Calendar className="mr-2 h-4 w-4" />
          <span>{todo.dueDate ? "Edit due date" : "Add due date"}</span>
        </ContextMenuItem>
        
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer">
            <Flag className="mr-2 h-4 w-4" />
            <span>Set Priority</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem 
              onClick={() => setPriority(todo.id, 'blocker')}
              className="cursor-pointer"
            >
              <ChevronsUp className="mr-2 h-4 w-4 text-red-600 dark:text-red-500" />
              <span className="text-red-600 dark:text-red-500">Blocker</span>
            </ContextMenuItem>
            
            <ContextMenuItem 
              onClick={() => setPriority(todo.id, 'important')}
              className="cursor-pointer"
            >
              <ChevronUp className="mr-2 h-4 w-4 text-amber-600 dark:text-amber-500" />
              <span className="text-amber-600 dark:text-amber-500">Important</span>
            </ContextMenuItem>
            
            <ContextMenuItem 
              onClick={() => setPriority(todo.id, 'low')}
              className="cursor-pointer"
            >
              <ChevronDownIcon className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-500" />
              <span className="text-blue-600 dark:text-blue-500">Less Important</span>
            </ContextMenuItem>
            
            <ContextMenuItem 
              onClick={() => setPriority(todo.id, 'lowest')}
              className="cursor-pointer"
            >
              <ChevronsDown className="mr-2 h-4 w-4 text-gray-600 dark:text-gray-500" />
              <span className="text-gray-600 dark:text-gray-500">Least Important</span>
            </ContextMenuItem>
            
            <ContextMenuSeparator />
            
            <ContextMenuItem 
              onClick={() => setPriority(todo.id, null)}
              className="cursor-pointer"
            >
              <span className="ml-6">Clear Priority</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        <ContextMenuSeparator />
        
        {/* Group 2: Task Management */}
        <ContextMenuItem 
          onClick={() => {
            const llmButton = document.querySelector(`#llm-button-${todo.id}`);
            if (llmButton) {
              (llmButton as HTMLButtonElement).click();
            }
          }}
          className="cursor-pointer"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          <span>AI Assistant</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => setIsCostDialogOpen(true)}
          className="cursor-pointer"
        >
          <DollarSign className="mr-2 h-4 w-4" />
          <span>{todo.cost !== undefined && todo.cost !== null ? "Edit cost" : "Add cost"}</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => setIsTimeEstimateDialogOpen(true)}
          className="cursor-pointer"
        >
          <Clock className="mr-2 h-4 w-4" />
          <span>{todo.timeEstimate !== undefined && todo.timeEstimate !== null ? "Edit time estimate" : "Add time estimate"}</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => setIsStoryPointDialogOpen(true)}
          className="cursor-pointer"
        >
          <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
          <span>{todo.storyPoints !== undefined && todo.storyPoints !== null ? "Edit story points" : "Add story points"}</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => setIsCustomMetricDialogOpen(true)}
          className="cursor-pointer"
        >
          <Ruler className="mr-2 h-4 w-4 text-amber-700 dark:text-amber-600" />
          <span>{todo.customMetricValue !== undefined && todo.customMetricValue !== null ? "Edit custom metric" : "Add custom metric"}</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => setIsListReferenceDialogOpen(true)}
          className="cursor-pointer"
        >
          <Link className="mr-2 h-4 w-4" />
          <span>{todo.linkedListId ? "Edit linked list" : "Link to list"}</span>
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        {/* Group 3: Organization & Sorting */}
        <ImportDialog 
          parentId={todo.id}
          trigger={
            <ContextMenuItem className="cursor-pointer" asChild>
              <div className="flex items-center px-2 py-1.5 w-full">
                <Import className="mr-2 h-4 w-4" />
                <span>Import</span>
              </div>
            </ContextMenuItem>
          }
        />
        
        {hasChildren && (
          <>
            <ContextMenuItem 
              onClick={() => sortChildrenAscending(todo.id)}
              className="cursor-pointer"
            >
              <ArrowDownAZ className="mr-2 h-4 w-4" />
              <span>Sort subtasks A-Z</span>
            </ContextMenuItem>
            
            <ContextMenuItem 
              onClick={() => sortChildrenDescending(todo.id)}
              className="cursor-pointer"
            >
              <ArrowUpZA className="mr-2 h-4 w-4" />
              <span>Sort subtasks Z-A</span>
            </ContextMenuItem>
          </>
        )}
        
        <ContextMenuSeparator />
        
        {/* Group 4: Advanced Operations */}
        <ContextMenuItem 
          onClick={() => duplicateTodo(todo.id)}
          className="cursor-pointer"
        >
          <Copy className="mr-2 h-4 w-4" />
          <span>Duplicate</span>
        </ContextMenuItem>
        
        {hasChildren && (
          <ContextMenuItem 
            onClick={() => combineTodo(todo.id)}
            className="cursor-pointer"
          >
            <Merge className="mr-2 h-4 w-4" />
            <span>Combine with subtasks</span>
          </ContextMenuItem>
        )}
        
        <SplitToNewListDialog
          todoId={todo.id}
          trigger={
            <ContextMenuItem 
              className="cursor-pointer" 
              asChild
              onClick={(e) => {
                // Prevent the context menu from closing immediately
                e.stopPropagation();
              }}
            >
              <div className="flex items-center px-2 py-1.5 w-full">
                <Split className="mr-2 h-4 w-4" />
                <span>Split to new list</span>
              </div>
            </ContextMenuItem>
          }
        />
        
        <ContextMenuItem 
          onClick={() => removeTodo(todo.id)}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <Trash className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default TodoItem;