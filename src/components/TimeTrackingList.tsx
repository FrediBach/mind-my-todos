import React, { useMemo } from 'react';
import { useTodoContextSafe } from '@/hooks/useContextSafe';
import { TodoItem, TimeEntry } from '@/contexts/TodoContext';
import { formatTime } from '@/util/time';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface TimeEntryWithTodo {
  entry: TimeEntry;
  todo: TodoItem;
}

interface GroupedTimeEntries {
  [date: string]: TimeEntryWithTodo[];
}

export const TimeTrackingList: React.FC = () => {
  const { todos } = useTodoContextSafe();

  // Recursively collect all time entries from all todos
  const collectTimeEntries = (todoItems: TodoItem[]): TimeEntryWithTodo[] => {
    let result: TimeEntryWithTodo[] = [];
    
    todoItems.forEach(todo => {
      // Add this todo's time entries
      if (todo.timeEntries && todo.timeEntries.length > 0) {
        todo.timeEntries.forEach(entry => {
          // Only add entries that have valid start and end times
          if (entry.startTime && entry.endTime && entry.duration > 0) {
            result.push({ entry, todo });
          }
        });
      }
      
      // Add entries from children
      if (todo.children.length > 0) {
        result = [...result, ...collectTimeEntries(todo.children)];
      }
    });
    
    return result;
  };

  // Group time entries by date
  const groupedTimeEntries = useMemo(() => {
    const allEntries = collectTimeEntries(todos);
    
    // Sort entries by start time (newest first)
    const sortedEntries = [...allEntries].sort((a, b) => 
      b.entry.startTime - a.entry.startTime
    );
    
    // Group by date
    const grouped: GroupedTimeEntries = {};
    
    sortedEntries.forEach(entryWithTodo => {
      const date = new Date(entryWithTodo.entry.startTime).toLocaleDateString();
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      
      grouped[date].push(entryWithTodo);
    });
    
    return grouped;
  }, [todos]);

  // Format time for display (e.g., "10:30 AM - 11:45 AM")
  const formatTimeRange = (startTime: number, endTime: number): string => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Calculate position and width for the range bar
  const calculateTimePosition = (startTime: number, endTime: number): { position: number; width: number } => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    // Calculate minutes since start of day (12:00 AM)
    const startOfDay = new Date(start);
    startOfDay.setHours(0, 0, 0, 0);
    
    const minutesSinceStartOfDay = (start.getTime() - startOfDay.getTime()) / (1000 * 60);
    const durationInMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    
    // Calculate position as percentage of day (24 hours = 1440 minutes)
    const position = (minutesSinceStartOfDay / 1440) * 100;
    const width = (durationInMinutes / 1440) * 100;
    
    return { position, width };
  };

  // If no time entries, show a message
  if (Object.keys(groupedTimeEntries).length === 0) {
    // Count total time entries for debugging
    let totalTimeEntries = 0;
    let validTimeEntries = 0;
    
    const countTimeEntries = (items: TodoItem[]) => {
      items.forEach(todo => {
        if (todo.timeEntries) {
          totalTimeEntries += todo.timeEntries.length;
          
          // Count valid entries
          todo.timeEntries.forEach(entry => {
            if (entry.startTime && entry.endTime && entry.duration > 0) {
              validTimeEntries++;
            }
          });
        }
        
        if (todo.children.length > 0) {
          countTimeEntries(todo.children);
        }
      });
    };
    
    countTimeEntries(todos);
    
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p>No time entries found.</p>
        <p className="text-sm mt-2">Start tracking time on your todos to see them here.</p>
        {totalTimeEntries > 0 && (
          <p className="text-xs mt-4">
            Found {totalTimeEntries} total time entries, but only {validTimeEntries} are valid with start/end times.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 w-full">
      {Object.entries(groupedTimeEntries).map(([date, entries]) => (
        <div key={date} className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">{date}</h3>
            <span className="text-sm text-muted-foreground">
              Total: {formatTime(entries.reduce((total, { entry }) => total + entry.duration, 0))}
            </span>
          </div>
          <div className="space-y-3">
            {entries.map((entryWithTodo, index) => {
              const { entry, todo } = entryWithTodo;
              const { position, width } = calculateTimePosition(entry.startTime, entry.endTime);
              
              return (
                <Card key={`${todo.id}-${index}`} className="p-3 space-y-2 w-full overflow-hidden">
                  <div className="font-medium truncate max-w-full overflow-hidden text-ellipsis" title={todo.text}>
                    {todo.text}
                  </div>
                  
                  <div className="relative h-8 bg-muted rounded-md overflow-hidden">
                    {/* Time markers */}
                    <div className="absolute inset-0 flex justify-between px-1 text-[10px] text-muted-foreground">
                      <span>12 AM</span>
                      <span>6 AM</span>
                      <span>12 PM</span>
                      <span>6 PM</span>
                      <span>12 AM</span>
                    </div>
                    
                    {/* Time division lines */}
                    <div className="absolute inset-0 flex justify-between pointer-events-none">
                      <div className="h-full w-px bg-border/30"></div>
                      <div className="h-full w-px bg-border/30"></div>
                      <div className="h-full w-px bg-border/30"></div>
                      <div className="h-full w-px bg-border/30"></div>
                      <div className="h-full w-px bg-border/30"></div>
                    </div>
                    
                    {/* Time range bar */}
                    <div 
                      className="absolute h-full bg-primary/30 rounded-md border border-primary/50"
                      style={{ 
                        left: `${position}%`, 
                        width: `${Math.max(width, 1)}%` 
                      }}
                    >
                      {width > 5 && (
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                          {formatTimeRange(entry.startTime, entry.endTime)}
                        </div>
                      )}
                    </div>
                    
                    {/* Time labels outside if bar is too small */}
                    {width <= 5 && (
                      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-xs">
                        {formatTimeRange(entry.startTime, entry.endTime)}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground flex justify-between">
                    <span>Duration: {formatTime(entry.duration)}</span>
                  </div>
                </Card>
              );
            })}
          </div>
          <Separator className="mt-4" />
        </div>
      ))}
    </div>
  );
};