import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTodoLists } from '@/contexts/TodoListsContext';
import { useTodoContext } from '@/contexts/TodoContext';
import { getTotalStats } from '@/util/todoStats';
import { ProgressWithText } from '@/components/ui/progress-with-text';
import { formatTime } from '@/util/time';
import { Link, ExternalLink } from 'lucide-react';

interface ListReferenceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  todoId: string;
  initialLinkedListId: string | null;
}

export const ListReferenceDialog: React.FC<ListReferenceDialogProps> = ({
  isOpen,
  onClose,
  todoId,
  initialLinkedListId
}) => {
  const { lists, activeListId, getListProgress } = useTodoLists();
  const { setLinkedList } = useTodoContext();
  const [selectedListId, setSelectedListId] = useState<string | null>(initialLinkedListId);

  // Filter out the current active list to prevent circular references
  const availableLists = lists.filter(list => list.id !== activeListId);

  const handleSave = () => {
    setLinkedList(todoId, selectedListId);
    onClose();
  };

  const handleRemoveLink = () => {
    setLinkedList(todoId, null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Link to Todo List</DialogTitle>
          <DialogDescription>
            Select a todo list to reference. The linked list's progress, costs, and time estimates will be reflected in this todo.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[300px] pr-4 mt-4">
          <div className="space-y-4">
            {availableLists.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No other lists available to link.</p>
                <p className="text-sm mt-2">Create more lists to use this feature.</p>
              </div>
            ) : (
              availableLists.map(list => {
                const isSelected = selectedListId === list.id;
                const progress = getListProgress(list.id);
                const stats = getTotalStats(list.todos);
                
                return (
                  <div 
                    key={list.id}
                    className={`p-4 rounded-md border cursor-pointer transition-colors ${
                      isSelected ? 'border-primary bg-primary/10' : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedListId(list.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ExternalLink size={16} className={isSelected ? 'text-primary' : ''} />
                        <span className="font-medium">{list.name}</span>
                      </div>
                      {isSelected && <Link size={16} className="text-primary" />}
                    </div>
                    
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Progress:</span>
                        <ProgressWithText 
                          value={progress} 
                          total={stats.total} 
                          completed={stats.completed} 
                          size="sm" 
                        />
                      </div>
                      
                      {stats.cumulativeCost > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Total cost:</span>
                          <span className="text-sm">${(stats.cumulativeCost + stats.paidCost).toFixed(2)}</span>
                        </div>
                      )}
                      
                      {stats.cumulativeTimeEstimate > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Time estimate:</span>
                          <span className="text-sm">{formatTime(stats.cumulativeTimeEstimate)}</span>
                        </div>
                      )}
                      
                      {stats.cumulativeTimeSpent > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Time spent:</span>
                          <span className="text-sm">{formatTime(stats.cumulativeTimeSpent)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between">
          <div>
            {initialLinkedListId && (
              <Button 
                variant="outline" 
                onClick={handleRemoveLink}
                className="text-destructive hover:text-destructive"
              >
                Remove Link
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={handleSave}
              disabled={!selectedListId || availableLists.length === 0}
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ListReferenceDialog;