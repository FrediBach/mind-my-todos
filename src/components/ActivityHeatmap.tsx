import React, { useMemo } from 'react';
import { TodoItem } from '@/contexts/TodoContext';
import { useTodoLists } from '@/contexts/TodoListsContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from 'next-themes';

// Function to get all dates in the past year
const getLastYearDates = (): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  
  for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }
  
  return dates;
};

// Function to format date as YYYY-MM-DD for comparison
const formatDateKey = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Function to get day of week (0-6, where 0 is Sunday)
const getDayOfWeek = (date: Date): number => {
  return date.getDay();
};

// Function to get month from date
const getMonth = (date: Date): number => {
  return date.getMonth();
};

// Function to get all todos with checkedDate from all lists
const getAllTodosWithCheckedDate = (lists: any[]): TodoItem[] => {
  const allTodos: TodoItem[] = [];
  
  // Helper function to flatten the todo tree
  const flattenTodos = (todos: TodoItem[]): void => {
    todos.forEach(todo => {
      if (todo.checkedDate) {
        allTodos.push(todo);
      }
      if (todo.children && todo.children.length > 0) {
        flattenTodos(todo.children);
      }
    });
  };
  
  // Process all lists
  lists.forEach(list => {
    if (list.todos && list.todos.length > 0) {
      flattenTodos(list.todos);
    }
  });
  
  return allTodos;
};

// Get color based on activity count
const getColorClass = (count: number, isDarkMode: boolean = true): string => {
  if (count === 0) return isDarkMode ? 'bg-gray-800' : 'bg-gray-200';
  if (count <= 2) return 'bg-green-900';
  if (count <= 5) return 'bg-green-700';
  if (count <= 10) return 'bg-green-500';
  return 'bg-green-300';
};

// Format date for tooltip
const formatDateForTooltip = (date: Date): string => {
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const ActivityHeatmap: React.FC = () => {
  const { lists } = useTodoLists();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  
  // Get all dates in the past year
  const yearDates = useMemo(() => getLastYearDates(), []);
  
  // Get all todos with checkedDate from all lists
  const todosWithCheckedDate = useMemo(() => getAllTodosWithCheckedDate(lists), [lists]);
  
  // Count todos completed on each date
  const dateActivityMap = useMemo(() => {
    const activityMap: Record<string, { count: number, todos: TodoItem[] }> = {};
    
    // Initialize all dates with zero count
    yearDates.forEach(date => {
      const dateKey = formatDateKey(date);
      activityMap[dateKey] = { count: 0, todos: [] };
    });
    
    // Count todos for each date
    todosWithCheckedDate.forEach(todo => {
      if (todo.checkedDate) {
        const dateKey = formatDateKey(new Date(todo.checkedDate));
        if (activityMap[dateKey]) {
          activityMap[dateKey].count += 1;
          activityMap[dateKey].todos.push(todo);
        }
      }
    });
    
    return activityMap;
  }, [yearDates, todosWithCheckedDate]);
  
  // Group dates by week for display
  const weekRows = useMemo(() => {
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    
    // Fill in empty cells at the beginning to align with day of week
    const firstDate = yearDates[0];
    const firstDayOfWeek = getDayOfWeek(firstDate);
    
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null as unknown as Date); // Add empty cells
    }
    
    // Group dates into weeks
    yearDates.forEach(date => {
      const dayOfWeek = getDayOfWeek(date);
      
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
      
      currentWeek.push(date);
      
      // If it's the last date, push the remaining week
      if (date.getTime() === yearDates[yearDates.length - 1].getTime()) {
        weeks.push([...currentWeek]);
      }
    });
    
    return weeks;
  }, [yearDates]);
  
  // Get month labels for the top of the heatmap
  const monthLabels = useMemo(() => {
    const labels: { month: string, index: number }[] = [];
    let currentMonth = -1;
    
    yearDates.forEach((date, index) => {
      const month = getMonth(date);
      if (month !== currentMonth) {
        currentMonth = month;
        labels.push({ 
          month: date.toLocaleDateString('en-US', { month: 'short' }), 
          index 
        });
      }
    });
    
    return labels;
  }, [yearDates]);
  
  return (
    <div className="w-full mt-8">
      <h3 className="text-lg font-medium mb-4">Activity Heatmap</h3>
      
      {/* Month labels */}
      <div className="flex mb-4 text-xs text-muted-foreground">
        <div className="w-8"></div> {/* Space for day labels */}
        <div className="flex-1 relative">
          {monthLabels.map((label, i) => {
            // Calculate position as percentage of total width
            const position = (label.index / yearDates.length) * 100;
            return (
              <div 
                key={i} 
                className="absolute"
                style={{ 
                  left: `${position}%`,
                  transform: i === 0 ? 'translateX(0)' : 'translateX(-50%)'
                }}
              >
                {label.month}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Heatmap grid */}
      <div className="flex">
        {/* Day of week labels */}
        <div className="flex flex-col justify-around h-[100px] mr-2 text-xs text-muted-foreground">
          <div>Mon</div>
          <div>Wed</div>
          <div>Fri</div>
        </div>
        
        {/* Activity cells */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex">
            <TooltipProvider>
              {weekRows.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col mr-[2px]">
                  {week.map((date, dayIndex) => {
                    if (!date) return <div key={`empty-${dayIndex}`} className="w-3 h-3 m-[1px]"></div>;
                    
                    const dateKey = formatDateKey(date);
                    const activity = dateActivityMap[dateKey];
                    const colorClass = getColorClass(activity?.count || 0, isDarkMode);
                    const tooltipText = `${formatDateForTooltip(date)}: ${activity?.count || 0} todos completed`;
                    
                    return (
                      <Tooltip key={dateKey}>
                        <TooltipTrigger asChild>
                          <div 
                            className={`w-3 h-3 m-[1px] rounded-sm ${colorClass} cursor-pointer`}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          {tooltipText}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </TooltipProvider>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center mt-2 text-xs text-muted-foreground">
        <span className="mr-1">Less</span>
        <div className={`w-3 h-3 ${getColorClass(0, isDarkMode)} rounded-sm mx-[1px]`}></div>
        <div className={`w-3 h-3 ${getColorClass(1, isDarkMode)} rounded-sm mx-[1px]`}></div>
        <div className={`w-3 h-3 ${getColorClass(4, isDarkMode)} rounded-sm mx-[1px]`}></div>
        <div className={`w-3 h-3 ${getColorClass(8, isDarkMode)} rounded-sm mx-[1px]`}></div>
        <div className={`w-3 h-3 ${getColorClass(12, isDarkMode)} rounded-sm mx-[1px]`}></div>
        <span className="ml-1">More</span>
      </div>
    </div>
  );
};

export default ActivityHeatmap;