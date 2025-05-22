import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface MixedEstimatesAlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const MixedEstimatesAlertDialog: React.FC<MixedEstimatesAlertDialogProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mixed Estimation Methods</AlertDialogTitle>
          <AlertDialogDescription>
            You are using both story points and time estimates in the same list. This is generally not recommended as they serve different purposes:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Story Points</strong>: Measure relative complexity and effort, not time</li>
              <li><strong>Time Estimates</strong>: Predict actual time needed to complete tasks</li>
            </ul>
            <p className="mt-2">
              Using both can lead to confusion and inconsistent project tracking. Consider using one method consistently across your list.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          <AlertDialogAction onClick={onClose}>Understood</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default MixedEstimatesAlertDialog;