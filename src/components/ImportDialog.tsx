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
import { FileUp } from 'lucide-react';
import { useTodoContext } from '@/contexts/TodoContext';
import { convertJiraToMarkdown, convertHtmlToMarkdown } from '@/util/markdown';

interface ImportDialogProps {
  parentId: string | null;
  trigger?: React.ReactNode;
}

// Helper function to detect if text is in Jira format
const isJiraFormat = (text: string): boolean => {
  // Jira format typically uses * or # for lists with multiple levels indicated by repeating the character
  // e.g., * Item, ** Sub-item, *** Sub-sub-item
  const jiraListRegex = /^\s*([*#]+)\s+.+/m;
  return jiraListRegex.test(text);
};

// Helper function to detect if text is in Markdown format
const isMarkdownFormat = (text: string): boolean => {
  // Markdown lists typically use -, *, + for unordered lists or numbers for ordered lists
  // with indentation for nesting
  const markdownListRegex = /^\s*[-*+]\s+.+|^\s*\d+\.\s+.+/m;
  return markdownListRegex.test(text);
};

// Helper function to detect if text is in HTML format
const isHtmlFormat = (text: string): boolean => {
  // Check for common HTML list tags
  const htmlListRegex = /<\s*(ul|ol|li)[^>]*>|<\s*\/\s*(ul|ol|li)\s*>/i;
  return htmlListRegex.test(text);
};

const ImportDialog: React.FC<ImportDialogProps> = ({ parentId, trigger }) => {
  const [inputText, setInputText] = useState('');
  const [open, setOpen] = useState(false);
  const [detectedFormat, setDetectedFormat] = useState<string | null>(null);
  const { importFromMarkdown } = useTodoContext();

  // Auto-detect format as user types
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    // Replace literal '\n' with actual newlines
    const processedText = text.replace(/\\n/g, '\n');
    setInputText(processedText);
    
    if (processedText.trim()) {
      if (isHtmlFormat(processedText)) {
        setDetectedFormat('HTML');
      } else if (isJiraFormat(processedText)) {
        setDetectedFormat('Jira');
      } else if (isMarkdownFormat(processedText)) {
        setDetectedFormat('Markdown');
      } else {
        setDetectedFormat(null);
      }
    } else {
      setDetectedFormat(null);
    }
  };

  const handleImport = () => {
    if (inputText.trim()) {
      let markdownText = inputText;
      
      // Convert to Markdown based on detected format
      if (detectedFormat === 'Jira') {
        markdownText = convertJiraToMarkdown(inputText);
      } else if (detectedFormat === 'HTML') {
        markdownText = convertHtmlToMarkdown(inputText);
      }
      
      // Use the existing Markdown import functionality
      importFromMarkdown(markdownText, parentId);
      setInputText('');
      setDetectedFormat(null);
      setOpen(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <FileUp className="mr-2 h-4 w-4" />
      Import
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Import Todos</DialogTitle>
          <DialogDescription>
            Paste your list below. The format will be auto-detected (Markdown, Jira, or HTML).
            Each list item will be converted to a todo. Nested lists will create nested todos.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Paste your Markdown, Jira, or HTML list here..."
            value={inputText}
            onChange={handleTextChange}
            className="h-[200px]"
          />
          {detectedFormat && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Detected format:</span>{' '}
              <span className="text-primary">{detectedFormat}</span>
            </div>
          )}
          <div className="mt-2 text-xs text-muted-foreground">
            <p>Supported formats:</p>
            <ul className="list-disc pl-4 mt-1 space-y-1">
              <li><span className="font-medium">Markdown:</span> Unordered lists with -, *, or +; Ordered lists with numbers; Use indentation (2 spaces) for nesting</li>
              <li><span className="font-medium">Jira:</span> Unordered lists with * (asterisks); Ordered lists with # (hash); Use multiple asterisks or hashes for nesting (**, ##)</li>
              <li><span className="font-medium">HTML:</span> Unordered lists with &lt;ul&gt; and &lt;li&gt;; Ordered lists with &lt;ol&gt; and &lt;li&gt;; Supports inline formatting (bold, italic, etc.)</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={!inputText.trim()}>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDialog;