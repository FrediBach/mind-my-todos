import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTodoContext } from '@/contexts/TodoContext';
import { formatTime } from '@/util/time';

interface TimeEstimateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  todoId: string;
  initialTimeEstimate?: number | null;
}

export const TimeEstimateDialog: React.FC<TimeEstimateDialogProps> = ({
  isOpen,
  onClose,
  todoId,
  initialTimeEstimate
}) => {
  const [hours, setHours] = useState<string>('');
  const [minutes, setMinutes] = useState<string>('');
  const { setTimeEstimate } = useTodoContext();

  // Reset time inputs when dialog opens
  useEffect(() => {
    if (isOpen && initialTimeEstimate) {
      const totalMinutes = Math.floor(initialTimeEstimate / 60);
      const hrs = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      
      setHours(hrs > 0 ? hrs.toString() : '');
      setMinutes(mins > 0 ? mins.toString() : '');
    } else if (isOpen) {
      setHours('');
      setMinutes('');
    }
  }, [isOpen, initialTimeEstimate]);

  const handleSave = () => {
    // Convert hours and minutes to seconds, or null if both empty
    const hoursNum = hours.trim() === '' ? 0 : parseInt(hours);
    const minutesNum = minutes.trim() === '' ? 0 : parseInt(minutes);
    
    if ((hours.trim() === '' && minutes.trim() === '') || (isNaN(hoursNum) && isNaN(minutesNum))) {
      // If both fields are empty or invalid, set to null
      setTimeEstimate(todoId, null);
    } else {
      // Calculate total seconds
      const totalSeconds = (hoursNum * 3600) + (minutesNum * 60);
      setTimeEstimate(todoId, totalSeconds);
    }
    
    onClose();
  };

  const handleClear = () => {
    setTimeEstimate(todoId, null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Time Estimate</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="hours" className="text-right">
              Hours
            </Label>
            <Input
              id="hours"
              type="number"
              min="0"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="Hours"
              className="col-span-3"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="minutes" className="text-right">
              Minutes
            </Label>
            <Input
              id="minutes"
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="Minutes"
              className="col-span-3"
            />
          </div>
          {initialTimeEstimate && (
            <div className="text-sm text-muted-foreground mt-2">
              Current estimate: {formatTime(initialTimeEstimate)}
            </div>
          )}
        </div>
        <DialogFooter>
          {initialTimeEstimate && (
            <Button variant="outline" onClick={handleClear} className="mr-auto">
              Clear
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TimeEstimateDialog;