import { TodoItem } from '@/contexts/TodoContext';
import { useTodoContext } from '@/contexts/TodoContext';

/**
 * Interface for todo statistics
 */
export interface TodoStats {
  total: number;
  completed: number;
  totalTimeSpent: number;
  completionPercentage: number;
  cumulativeTimeSpent: number; // Total time including all children
  cumulativeCost: number; // Total cost including all children
  paidCost: number; // Cost of completed todos
  unpaidCost: number; // Cost of uncompleted todos
  totalTimeEstimate: number; // Total estimated time
  cumulativeTimeEstimate: number; // Total estimated time including all children
  timeEfficiency: number; // Ratio of actual time to estimated time (< 1 means faster than estimated)
  totalStoryPoints: number; // Total story points for this todo
  cumulativeStoryPoints: number; // Total story points including all children
  customMetrics?: { [unit: string]: number }; // Custom metrics aggregated by unit
}

/**
 * Calculate statistics for a single todo and its children
 * @param todo - The todo item to calculate statistics for
 * @param getLinkedListStats - Optional function to get stats for linked lists
 * @returns Object containing total, completed, totalTimeSpent, and cumulativeTimeSpent
 */
export const getTodoStats = (todo: TodoItem, getLinkedListStats?: (listId: string) => any): TodoStats => {
  let total = 1; // Count this item
  let completed = todo.completed ? 1 : 0;
  let totalTimeSpent = todo.timeSpent || 0;
  let cumulativeTimeSpent = todo.timeSpent || 0; // Start with this todo's time
  
  // Calculate costs
  let cumulativeCost = todo.completed ? 0 : (todo.cost || 0); // Only include this todo's cost if not completed
  let paidCost = todo.completed ? (todo.cost || 0) : 0; // If completed, count as paid
  let unpaidCost = todo.completed ? 0 : (todo.cost || 0); // If not completed, count as unpaid
  
  // Calculate time estimates
  let totalTimeEstimate = todo.timeEstimate || 0;
  let cumulativeTimeEstimate = todo.timeEstimate || 0; // Start with this todo's estimate
  
  // Calculate story points
  let totalStoryPoints = todo.storyPoints || 0;
  let cumulativeStoryPoints = todo.storyPoints || 0; // Start with this todo's story points
  
  // Initialize custom metrics object
  let customMetrics: { [unit: string]: number } = {};
  
  // Add this todo's custom metrics if they exist
  if (todo.customMetrics && todo.customMetrics.length > 0) {
    // Add each custom metric to the aggregation
    todo.customMetrics.forEach(metric => {
      customMetrics[metric.unit] = metric.value;
    });
  } 
  // Legacy support for old format
  else if (todo.customMetricValue !== null && todo.customMetricValue !== undefined && 
      todo.customMetricUnit !== null && todo.customMetricUnit !== undefined) {
    customMetrics[todo.customMetricUnit] = todo.customMetricValue;
  }
  
  // Include linked list statistics if available
  if (todo.linkedListId && getLinkedListStats) {
    const linkedStats = getLinkedListStats(todo.linkedListId);
    if (linkedStats) {
      // Add linked list stats to this todo's stats
      total += linkedStats.total;
      completed += linkedStats.completed;
      totalTimeSpent += linkedStats.totalTimeSpent;
      cumulativeTimeSpent += linkedStats.cumulativeTimeSpent;
      
      // Only add metrics if the todo is not completed
      if (!todo.completed) {
        totalTimeEstimate += linkedStats.totalTimeEstimate;
        cumulativeTimeEstimate += linkedStats.cumulativeTimeEstimate;
        totalStoryPoints += linkedStats.totalStoryPoints || 0;
        cumulativeStoryPoints += linkedStats.cumulativeStoryPoints || 0;
        
        // Add costs from linked list
        cumulativeCost += linkedStats.cumulativeCost;
        unpaidCost += linkedStats.unpaidCost;
        
        // Add custom metrics from linked list if they exist
        if (linkedStats.customMetrics) {
          Object.entries(linkedStats.customMetrics).forEach(([unit, value]) => {
            const numericValue = Number(value);
            if (!isNaN(numericValue)) {
              if (customMetrics[unit]) {
                customMetrics[unit] += numericValue;
              } else {
                customMetrics[unit] = numericValue;
              }
            }
          });
        }
      }
      
      // Always add paid costs
      paidCost += linkedStats.paidCost;
    }
  }
  
  // Add stats from children
  todo.children.forEach(child => {
    const childStats = getTodoStats(child);
    total += childStats.total;
    completed += childStats.completed;
    totalTimeSpent += childStats.totalTimeSpent;
    
    // Always add time spent regardless of completion status
    cumulativeTimeSpent += childStats.cumulativeTimeSpent; // Add child's cumulative time
    
    // Always add child's paid costs to the paid cost total
    paidCost += childStats.paidCost;
    
    // Only add child's metrics to cumulative totals if the child is not completed
    if (!child.completed) {
      totalTimeEstimate += childStats.totalTimeEstimate;
      cumulativeTimeEstimate += childStats.cumulativeTimeEstimate; // Add child's cumulative estimate
      totalStoryPoints += childStats.totalStoryPoints;
      cumulativeStoryPoints += childStats.cumulativeStoryPoints; // Add child's cumulative story points
      
      // Only add child's unpaid costs to cumulative and unpaid if parent is not completed
      if (!todo.completed) {
        cumulativeCost += childStats.cumulativeCost; // Add child's cumulative cost
        unpaidCost += childStats.unpaidCost; // Add child's unpaid cost
      }
      
      // Add child's custom metrics only if child is not completed
      if (childStats.customMetrics) {
        Object.entries(childStats.customMetrics).forEach(([unit, value]) => {
          const numericValue = Number(value);
          if (!isNaN(numericValue)) {
            if (customMetrics[unit]) {
              customMetrics[unit] += numericValue;
            } else {
              customMetrics[unit] = numericValue;
            }
          }
        });
      }
    }
  });
  
  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  // Calculate time efficiency (ratio of actual time to estimated time)
  // Values less than 1 mean faster than estimated, greater than 1 mean slower than estimated
  let timeEfficiency = 0;
  if (cumulativeTimeEstimate > 0 && cumulativeTimeSpent > 0) {
    timeEfficiency = cumulativeTimeSpent / cumulativeTimeEstimate;
  }
  
  return { 
    total, 
    completed, 
    totalTimeSpent, 
    completionPercentage, 
    cumulativeTimeSpent, 
    cumulativeCost,
    paidCost,
    unpaidCost,
    totalTimeEstimate,
    cumulativeTimeEstimate,
    timeEfficiency,
    totalStoryPoints,
    cumulativeStoryPoints,
    customMetrics: Object.keys(customMetrics).length > 0 ? customMetrics : undefined
  };
};

/**
 * Calculate statistics for an array of todos
 * @param todos - Array of todo items
 * @param getLinkedListStats - Optional function to get stats for linked lists
 * @returns Object containing total, completed, totalTimeSpent, and cumulativeTimeSpent
 */
export const getTotalStats = (todos: TodoItem[], getLinkedListStats?: (listId: string) => any): TodoStats => {
  let total = 0;
  let completed = 0;
  let totalTimeSpent = 0;
  let cumulativeTimeSpent = 0;
  let cumulativeCost = 0;
  let paidCost = 0;
  let unpaidCost = 0;
  let totalTimeEstimate = 0;
  let cumulativeTimeEstimate = 0;
  let totalStoryPoints = 0;
  let cumulativeStoryPoints = 0;
  let customMetrics: { [unit: string]: number } = {};
  
  todos.forEach(todo => {
    const stats = getTodoStats(todo, getLinkedListStats);
    total += stats.total;
    completed += stats.completed;
    totalTimeSpent += stats.totalTimeSpent;
    cumulativeTimeSpent += stats.cumulativeTimeSpent;
    cumulativeCost += stats.cumulativeCost;
    paidCost += stats.paidCost;
    unpaidCost += stats.unpaidCost;
    totalTimeEstimate += stats.totalTimeEstimate;
    cumulativeTimeEstimate += stats.cumulativeTimeEstimate;
    totalStoryPoints += stats.totalStoryPoints;
    cumulativeStoryPoints += stats.cumulativeStoryPoints;
    
    // Aggregate custom metrics
    if (stats.customMetrics) {
      Object.entries(stats.customMetrics).forEach(([unit, value]) => {
        const numericValue = Number(value);
        if (!isNaN(numericValue)) {
          if (customMetrics[unit]) {
            customMetrics[unit] += numericValue;
          } else {
            customMetrics[unit] = numericValue;
          }
        }
      });
    }
  });
  
  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  // Calculate time efficiency (ratio of actual time to estimated time)
  let timeEfficiency = 0;
  if (cumulativeTimeEstimate > 0 && cumulativeTimeSpent > 0) {
    timeEfficiency = cumulativeTimeSpent / cumulativeTimeEstimate;
  }
  
  return { 
    total, 
    completed, 
    totalTimeSpent, 
    completionPercentage, 
    cumulativeTimeSpent, 
    cumulativeCost,
    paidCost,
    unpaidCost,
    totalTimeEstimate,
    cumulativeTimeEstimate,
    timeEfficiency,
    totalStoryPoints,
    cumulativeStoryPoints,
    customMetrics: Object.keys(customMetrics).length > 0 ? customMetrics : undefined
  };
};