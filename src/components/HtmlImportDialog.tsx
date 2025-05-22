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
import { convertHtmlToMarkdown } from '@/util/markdown';

interface HtmlImportDialogProps {
  parentId: string | null;
  trigger?: React.ReactNode;
}

const HtmlImportDialog: React.FC<HtmlImportDialogProps> = ({ parentId, trigger }) => {
  const [htmlMarkup, setHtmlMarkup] = useState('');
  const [open, setOpen] = useState(false);
  const { importFromMarkdown } = useTodoContext();

  const handleImport = () => {
    if (htmlMarkup.trim()) {
      // Convert HTML markup to Markdown
      const markdown = convertHtmlToMarkdown(htmlMarkup);
      // Use the existing Markdown import functionality
      importFromMarkdown(markdown, parentId);
      setHtmlMarkup('');
      setOpen(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Import className="mr-2 h-4 w-4" />
      Import from HTML
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Import from HTML</DialogTitle>
          <DialogDescription>
            Paste your HTML formatted list below. It will be converted to Markdown and imported as todos.
            Nested lists will create nested todos. Inline formatting (bold, italic, etc.) will be preserved.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Paste your Markdown, Jira, or HTML list here..."
            value={htmlMarkup}
            onChange={(e) => {
              // Replace literal '\n' with actual newlines
              const processedText = e.target.value.replace(/\\n/g, '\n');
              setHtmlMarkup(processedText);
            }}
            className="h-[200px]"
          />
          <div className="mt-2 text-xs text-muted-foreground">
            <p>Supported HTML elements:</p>
            <ul className="list-disc pl-4 mt-1 space-y-1">
              <li>List elements: <code>&lt;ul&gt;</code>, <code>&lt;ol&gt;</code>, <code>&lt;li&gt;</code></li>
              <li>Formatting: <code>&lt;strong&gt;</code>, <code>&lt;b&gt;</code>, <code>&lt;em&gt;</code>, <code>&lt;i&gt;</code>, <code>&lt;code&gt;</code>, <code>&lt;del&gt;</code>, <code>&lt;s&gt;</code></li>
              <li>Links: <code>&lt;a href="..."&gt;</code></li>
              <li>Checkboxes: <code>&lt;input type="checkbox" checked&gt;</code></li>
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

export default HtmlImportDialog;