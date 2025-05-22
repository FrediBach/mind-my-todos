import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTodoContext } from '@/contexts/TodoContext';
import { useConfigContext } from '@/contexts/ConfigContext';

interface CostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  todoId: string;
  initialCost?: number | null;
}

export const CostDialog: React.FC<CostDialogProps> = ({
  isOpen,
  onClose,
  todoId,
  initialCost
}) => {
  const [cost, setCost] = useState<string>(initialCost ? initialCost.toString() : '');
  const { setCost: setTodoCost } = useTodoContext();
  const { config } = useConfigContext();

  // Reset cost input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCost(initialCost ? initialCost.toString() : '');
    }
  }, [isOpen, initialCost]);

  const handleSave = () => {
    // Convert to number, or null if empty or invalid
    const numericCost = cost.trim() === '' ? null : parseFloat(cost);
    
    // Only save if it's a valid number or null
    if (numericCost === null || !isNaN(numericCost)) {
      setTodoCost(todoId, numericCost);
      onClose();
    }
  };

  const handleClear = () => {
    setTodoCost(todoId, null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Cost</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cost" className="text-right">
              Cost {config.currency.position === 'before' ? `(${config.currency.symbol})` : ''}
            </Label>
            <div className="col-span-3 flex items-center">
              {config.currency.position === 'before' && (
                <span className="mr-2">{config.currency.symbol}</span>
              )}
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="Enter cost amount"
                className="flex-1"
                autoFocus
              />
              {config.currency.position === 'after' && (
                <span className="ml-2">{config.currency.symbol}</span>
              )}
            </div>
          </div>
          <div className="text-xs text-muted-foreground px-4">
            Currency: {config.currency.code}
          </div>
        </div>
        <DialogFooter>
          {initialCost && (
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

export default CostDialog;