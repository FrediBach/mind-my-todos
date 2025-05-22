import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTodoContextSafe } from '@/hooks/useContextSafe';
import { CustomMetric, TodoItem } from '@/contexts/TodoContext';
import { Trash } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface CustomMetricDialogProps {
  isOpen: boolean;
  onClose: () => void;
  todoId: string;
  initialValue?: number | null;
  initialUnit?: string | null;
}

export const CustomMetricDialog: React.FC<CustomMetricDialogProps> = ({
  isOpen,
  onClose,
  todoId,
  initialValue = null,
  initialUnit = null,
}) => {
  const { todos, addCustomMetric, removeCustomMetric } = useTodoContextSafe();
  const [value, setValue] = useState<string>('');
  const [unit, setUnit] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [existingMetrics, setExistingMetrics] = useState<CustomMetric[]>([]);

  // Find the todo and get its existing metrics
  useEffect(() => {
    if (isOpen) {
      const findTodo = (items: TodoItem[]): TodoItem | null => {
        for (const item of items) {
          if (item.id === todoId) {
            return item;
          }
          if (item.children.length > 0) {
            const found = findTodo(item.children);
            if (found) return found;
          }
        }
        return null;
      };

      const todo = findTodo(todos);
      if (todo) {
        // Initialize with existing metrics
        if (todo.customMetrics && todo.customMetrics.length > 0) {
          setExistingMetrics([...todo.customMetrics]);
        } 
        // Legacy support
        else if (todo.customMetricValue !== null && todo.customMetricValue !== undefined && 
                todo.customMetricUnit !== null && todo.customMetricUnit !== undefined) {
          setExistingMetrics([{ value: todo.customMetricValue, unit: todo.customMetricUnit }]);
        }
        else {
          setExistingMetrics([]);
        }
      }
      
      // Reset form fields
      setValue('');
      setUnit('');
      setError(null);
    }
  }, [isOpen, todoId, todos]);

  const handleAddMetric = () => {
    // Validate input
    if (!value.trim()) {
      setError('Please enter a value');
      return;
    }

    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      setError('Please enter a valid number');
      return;
    }

    if (!unit.trim()) {
      setError('Please enter a unit');
      return;
    }

    // Check if a metric with this unit already exists
    if (existingMetrics.some(metric => metric.unit.toLowerCase() === unit.toLowerCase())) {
      setError(`A metric with unit "${unit}" already exists`);
      return;
    }

    // Add the new metric
    addCustomMetric(todoId, numericValue, unit);
    
    // Update local state
    setExistingMetrics([...existingMetrics, { value: numericValue, unit }]);
    
    // Clear form
    setValue('');
    setUnit('');
    setError(null);
  };

  const handleRemoveMetric = (unitToRemove: string) => {
    // Remove the metric
    removeCustomMetric(todoId, unitToRemove);
    
    // Update local state
    setExistingMetrics(existingMetrics.filter(metric => metric.unit !== unitToRemove));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Custom Metrics</DialogTitle>
        </DialogHeader>
        
        {/* Existing metrics section */}
        {existingMetrics.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Current Metrics</h3>
            <ScrollArea className="h-[120px] rounded-md border p-2">
              <div className="space-y-2">
                {existingMetrics.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span>
                      {metric.value} {metric.unit}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveMetric(metric.unit)}
                      className="h-8 w-8"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        
        <Separator className="my-2" />
        
        {/* Add new metric section */}
        <div className="grid gap-4 py-4">
          <h3 className="text-sm font-medium">Add New Metric</h3>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="value" className="text-right">
              Value
            </Label>
            <Input
              id="value"
              type="number"
              step="any"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              className="col-span-3"
              placeholder="Enter a numeric value"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unit" className="text-right">
              Unit
            </Label>
            <Input
              id="unit"
              value={unit}
              onChange={(e) => {
                setUnit(e.target.value);
                setError(null);
              }}
              className="col-span-3"
              placeholder="e.g., kg, miles, points"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          
          <Button 
            onClick={handleAddMetric} 
            disabled={!value.trim() || !unit.trim()}
            className="ml-auto"
          >
            Add Metric
          </Button>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomMetricDialog;