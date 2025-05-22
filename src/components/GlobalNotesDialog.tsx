import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StickyNote, Edit, Save } from 'lucide-react';
import { HighlightedMarkdown } from './HighlightedMarkdown';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MarkdownToolbar } from './MarkdownToolbar';

interface GlobalNotesDialogProps {
  notes: string;
  onNotesChange: (notes: string) => void;
}

const GlobalNotesDialog: React.FC<GlobalNotesDialogProps> = ({ notes, onNotesChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(notes);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = () => {
    onNotesChange(editedNotes);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedNotes(notes);
    setIsEditing(false);
  };

  // Update local state when props change
  React.useEffect(() => {
    setEditedNotes(notes);
  }, [notes]);

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          // Reset editing state when dialog closes
          setIsEditing(false);
          setEditedNotes(notes);
        }
      }}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <StickyNote className="h-4 w-4" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Global Notes</p>
          </TooltipContent>
        </Tooltip>

        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Global Notes</DialogTitle>
          </DialogHeader>
          
          {isEditing ? (
            <div className="space-y-2">
              <MarkdownToolbar 
                textareaRef={textareaRef}
                value={editedNotes}
                onChange={setEditedNotes}
              />
              <Textarea
                ref={textareaRef}
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                placeholder="Add notes, links, or any information in Markdown format..."
                className="min-h-[250px] w-full"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {notes ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <HighlightedMarkdown text={notes} fullMarkdown={true} />
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No global notes added yet. Click edit to add information, links, or descriptions.
                </p>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(true)}
                className="mt-2"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default GlobalNotesDialog;