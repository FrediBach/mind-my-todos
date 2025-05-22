import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useTodoContext } from '@/contexts/TodoContext';
import { toast } from 'sonner';

interface StoryPointDialogProps {
  isOpen: boolean;
  onClose: () => void;
  todoId: string;
  initialStoryPoints?: number | null;
}

// Fibonacci sequence commonly used for story points
const STORY_POINT_VALUES = [1, 2, 3, 5, 8, 13, 21];

export const StoryPointDialog: React.FC<StoryPointDialogProps> = ({
  isOpen,
  onClose,
  todoId,
  initialStoryPoints
}) => {
  const [storyPoints, setStoryPoints] = useState<number | null>(initialStoryPoints || null);
  const { setStoryPoints: setTodoStoryPoints } = useTodoContext();

  // Reset story points input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStoryPoints(initialStoryPoints || null);
    }
  }, [isOpen, initialStoryPoints]);

  const handleSave = () => {
    setTodoStoryPoints(todoId, storyPoints);
    toast.success(`Story points ${storyPoints ? `set to ${storyPoints}` : 'cleared'}`);
    onClose();
  };

  const handleClear = () => {
    setTodoStoryPoints(todoId, null);
    toast.success('Story points cleared');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Story Points</DialogTitle>
          <DialogDescription>
            Story points represent the relative complexity and effort of a task, not the time it will take.
            Higher values indicate more complex tasks.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <RadioGroup 
            value={storyPoints?.toString() || ''} 
            onValueChange={(value) => setStoryPoints(value ? parseInt(value) : null)}
            className="grid grid-cols-4 gap-4"
          >
            {STORY_POINT_VALUES.map((value) => (
              <div key={value} className="flex items-center space-x-2">
                <RadioGroupItem value={value.toString()} id={`sp-${value}`} />
                <Label htmlFor={`sp-${value}`} className="cursor-pointer">{value}</Label>
              </div>
            ))}
          </RadioGroup>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Story point guidelines:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>1-2: Very simple tasks with minimal complexity</li>
              <li>3-5: Moderate complexity, some unknowns</li>
              <li>8-13: Complex tasks with significant unknowns</li>
              <li>21+: Very complex tasks that should probably be broken down</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          {initialStoryPoints && (
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

export default StoryPointDialog;