import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Import } from 'lucide-react';
import { useTodoContext } from '@/contexts/TodoContext';

interface MarkdownImportDialogProps {
  parentId: string | null;
  trigger?: React.ReactNode;
}

const MarkdownImportDialog: React.FC<MarkdownImportDialogProps> = ({ parentId, trigger }) => {
  const [markdown, setMarkdown] = useState('');
  const [open, setOpen] = useState(false);
  const { importFromMarkdown } = useTodoContext();

  const handleImport = () => {
    if (markdown.trim()) {
      importFromMarkdown(markdown, parentId);
      setMarkdown('');
      setOpen(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Import className="mr-2 h-4 w-4" />
      Import from Markdown
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Import from Markdown</DialogTitle>
          <DialogDescription>
            Paste your Markdown list below. Each list item will be converted to a todo.
            Nested lists will create nested todos. Status indicators ([x] or [ ]) will be recognized.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Paste your Markdown, Jira, or HTML list here..."
            value={markdown}
            onChange={(e) => {
              // Replace literal '\n' with actual newlines
              const processedText = e.target.value.replace(/\\n/g, '\n');
              setMarkdown(processedText);
            }}
            className="h-[200px]"
          />
          <div className="mt-2 text-xs text-muted-foreground">
            <p>Supported formats:</p>
            <ul className="list-disc pl-4 mt-1 space-y-1">
              <li>Unordered lists with -, *, or +</li>
              <li>Ordered lists with numbers (1., 2., etc.)</li>
              <li>Use indentation (2 spaces) for nesting</li>
              <li>Status indicators: [x] for completed, [ ] for incomplete</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleImport}>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MarkdownImportDialog;