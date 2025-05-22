import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TimeTrackingList } from '@/components/TimeTrackingList';

interface TimeCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TimeCalendarDialog: React.FC<TimeCalendarDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Time Tracking History</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <TimeTrackingList />
        </div>
      </DialogContent>
    </Dialog>
  );
};