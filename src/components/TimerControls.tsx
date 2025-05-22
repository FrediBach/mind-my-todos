import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, StopCircle, Clock } from 'lucide-react';
import { useTimeTrackingSafe } from '@/hooks/useContextSafe';
import { Badge } from '@/components/ui/badge';
import { formatTime } from '@/util/time';

interface TimerControlsProps {
  onOpenCalendar?: () => void;
}

export const TimerControls: React.FC<TimerControlsProps> = ({ onOpenCalendar }) => {
  const { 
    timerStatus, 
    elapsedTime, 
    startTimer, 
    pauseTimer, 
    stopTimer
  } = useTimeTrackingSafe();

  const handleStopTimer = () => {
    // Simply stop the timer without adding time to any todo
    // Time will be added when a todo is checked
    stopTimer();
  };

  return (
    <div className="flex items-center gap-2">
      {/* Clock icon for opening time tracking history */}
      {onOpenCalendar && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onOpenCalendar}
          className="h-8 w-8"
          title="View Time Tracking History"
        >
          <Clock size={16} />
        </Button>
      )}
      
      {/* Timer display - always show, with 00:00 when not tracking */}
      <Badge variant="outline" className="font-mono text-sm h-8 flex items-center">
        {elapsedTime > 0 ? formatTime(elapsedTime) : "00:00"}
      </Badge>
      
      {/* Control buttons - always show all three, but disable as needed */}
      <div className="flex items-center gap-1">
        {/* Start/Resume button */}
        <Button 
          variant="outline" 
          size="icon"
          onClick={startTimer}
          className="h-8 w-8"
          disabled={timerStatus === 'running'}
          title={timerStatus === 'paused' ? "Resume Timer" : "Start Timer"}
        >
          <Play size={16} />
        </Button>
        
        {/* Pause button */}
        <Button 
          variant="outline" 
          size="icon"
          onClick={pauseTimer}
          className="h-8 w-8"
          disabled={timerStatus !== 'running'}
          title="Pause Timer"
        >
          <Pause size={16} />
        </Button>
        
        {/* Stop button */}
        <Button 
          variant="outline" 
          size="icon"
          onClick={handleStopTimer}
          className="h-8 w-8"
          disabled={timerStatus === 'idle'}
          title="Stop Timer"
        >
          <StopCircle size={16} />
        </Button>
      </div>
    </div>
  );
};