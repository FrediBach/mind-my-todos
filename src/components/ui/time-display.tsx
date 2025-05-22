import React from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatTime } from '@/util/time';

interface TimeDisplayProps {
  seconds: number;
  showIcon?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Displays time in a formatted way with optional clock icon
 */
export const TimeDisplay: React.FC<TimeDisplayProps> = ({
  seconds,
  showIcon = true,
  variant = 'outline',
  size = 'md',
  className
}) => {
  if (!seconds && seconds !== 0) return null;
  
  // Don't show if time is 0
  if (seconds === 0) return null;
  
  // Determine size classes
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {showIcon && <Clock size={iconSize} className="text-muted-foreground" />}
      <Badge variant={variant} className={cn("font-mono", sizeClasses[size])}>
        {formatTime(seconds)}
      </Badge>
    </div>
  );
};

export default TimeDisplay;