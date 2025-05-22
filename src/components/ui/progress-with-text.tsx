import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProgressWithTextProps {
  value: number;
  total?: number;
  completed?: number;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

/**
 * Progress bar with percentage text and optional completion count
 */
export const ProgressWithText: React.FC<ProgressWithTextProps> = ({
  value,
  total,
  completed,
  size = 'md',
  showText = true,
  className
}) => {
  // Determine height based on size
  const heightClass = size === 'sm' ? 'h-1' : size === 'lg' ? 'h-2' : 'h-1.5';
  
  // Determine color class based on completion percentage
  const colorClass = value === 100 
    ? 'progress-complete' 
    : value >= 75 
      ? 'progress-high' 
      : value >= 40 
        ? 'progress-medium' 
        : 'progress-low';
  
  return (
    <div className="space-y-1">
      {showText && (
        <div className="flex justify-between text-xs text-muted-foreground">
          {total !== undefined && completed !== undefined ? (
            <span>{completed}/{total}</span>
          ) : (
            <span>Progress</span>
          )}
          <span>{value}%</span>
        </div>
      )}
      <Progress 
        value={value} 
        className={cn(heightClass, colorClass, className)} 
      />
    </div>
  );
};

export default ProgressWithText;