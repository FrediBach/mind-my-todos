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
import { convertJiraToMarkdown } from '@/util/markdown';

interface JiraImportDialogProps {
  parentId: string | null;
  trigger?: React.ReactNode;
}

const JiraImportDialog: React.FC<JiraImportDialogProps> = ({ parentId, trigger }) => {
  const [jiraMarkup, setJiraMarkup] = useState('');
  const [open, setOpen] = useState(false);
  const { importFromMarkdown } = useTodoContext();

  const handleImport = () => {
    if (jiraMarkup.trim()) {
      // Convert Jira markup to Markdown
      const markdown = convertJiraToMarkdown(jiraMarkup);
      // Use the existing Markdown import functionality
      importFromMarkdown(markdown, parentId);
      setJiraMarkup('');
      setOpen(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Import className="mr-2 h-4 w-4" />
      Import from Jira
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Import from Jira</DialogTitle>
          <DialogDescription>
            Paste your Jira formatted text below. It will be converted to Markdown and imported as todos.
            Nested lists will create nested todos. Status indicators (✓ or ✗) will be recognized.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Paste your Markdown, Jira, or HTML list here..."
            value={jiraMarkup}
            onChange={(e) => {
              // Replace literal '\n' with actual newlines
              const processedText = e.target.value.replace(/\\n/g, '\n');
              setJiraMarkup(processedText);
            }}
            className="h-[200px]"
          />
          <div className="mt-2 text-xs text-muted-foreground">
            <p>Supported Jira formats:</p>
            <ul className="list-disc pl-4 mt-1 space-y-1">
              <li>Unordered lists with * (asterisks)</li>
              <li>Ordered lists with # (hash)</li>
              <li>Use multiple asterisks or hashes for nesting (**, ##)</li>
              <li>Status indicators: (✓) for completed, (✗) for incomplete</li>
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

export default JiraImportDialog;