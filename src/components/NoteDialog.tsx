import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTodoContext } from '@/contexts/TodoContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReactMarkdown from 'react-markdown';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { convertEmoticonsToEmojis } from '@/util/string';
import { HighlightedMarkdown } from './HighlightedMarkdown';
import { MarkdownToolbar } from './MarkdownToolbar';

interface NoteDialogProps {
  todoId: string;
  isOpen: boolean;
  onClose: () => void;
  initialNote?: string;
  initialColor?: 'red' | 'orange' | 'green' | 'blue';
}

export function NoteDialog({ todoId, isOpen, onClose, initialNote = '', initialColor }: NoteDialogProps) {
  const { addNote, removeNote, searchQuery } = useTodoContext();
  const [note, setNote] = useState(initialNote);
  const [selectedColor, setSelectedColor] = useState<'red' | 'orange' | 'green' | 'blue' | undefined>(initialColor);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset note when dialog opens with new initialNote
  useEffect(() => {
    if (isOpen) {
      setNote(initialNote);
      setSelectedColor(initialColor);
    }
  }, [isOpen, initialNote, initialColor]);

  const handleSave = () => {
    if (note.trim()) {
      addNote(todoId, note.trim(), selectedColor);
    } else {
      removeNote(todoId);
    }
    onClose();
  };

  const handleRemove = () => {
    removeNote(todoId);
    onClose();
  };

  const getColorClass = (color?: string) => {
    switch (color) {
      case 'red':
        return 'bg-red-50 dark:bg-red-950/50';
      case 'orange':
        return 'bg-orange-50 dark:bg-orange-950/50';
      case 'green':
        return 'bg-green-50 dark:bg-green-950/50';
      case 'blue':
        return 'bg-blue-50 dark:bg-blue-950/50';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="py-4">
            <MarkdownToolbar 
              textareaRef={textareaRef} 
              value={note} 
              onChange={setNote} 
            />
            <Textarea
              placeholder="Enter your note here... Markdown formatting is supported."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[150px]"
              autoFocus
              ref={textareaRef}
            />
            <div className="text-xs text-muted-foreground mt-2">
              <p>Markdown formatting is supported (bold, italic, links, etc.)</p>
              <p className="mt-1">Text emoticons like :-) will be automatically converted to emojis 😊</p>
            </div>
            
            <div className="mt-4">
              <div className="text-sm mb-2">Note Color (optional):</div>
              <ToggleGroup type="single" value={selectedColor} onValueChange={(value: any) => setSelectedColor(value)}>
                <ToggleGroupItem value="red" className="flex-1 h-8">
                  <div className="w-4 h-4 rounded-full bg-red-500 dark:bg-red-400"></div>
                </ToggleGroupItem>
                <ToggleGroupItem value="orange" className="flex-1 h-8">
                  <div className="w-4 h-4 rounded-full bg-orange-500 dark:bg-orange-400"></div>
                </ToggleGroupItem>
                <ToggleGroupItem value="green" className="flex-1 h-8">
                  <div className="w-4 h-4 rounded-full bg-green-500 dark:bg-green-400"></div>
                </ToggleGroupItem>
                <ToggleGroupItem value="blue" className="flex-1 h-8">
                  <div className="w-4 h-4 rounded-full bg-blue-500 dark:bg-blue-400"></div>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </TabsContent>
          <TabsContent value="preview" className="py-4">
            <div className={cn("border rounded-md p-4 min-h-[150px] markdown-preview", getColorClass(selectedColor))}>
              {note ? (
                <HighlightedMarkdown
                  text={note}
                  searchTerm={searchQuery}
                  fullMarkdown={true}
                />
              ) : (
                <p className="text-muted-foreground">Preview will appear here...</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter className="flex justify-between sm:justify-between">
          {initialNote && (
            <Button variant="destructive" onClick={handleRemove}>
              Remove Note
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}