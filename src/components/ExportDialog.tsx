import React, { useState, useEffect } from 'react';
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
import { FileDown, Copy, Check } from 'lucide-react';
import { useTodoContext } from '@/contexts/TodoContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ExportDialogProps {
  trigger?: React.ReactNode;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ trigger }) => {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<'markdown' | 'jira' | 'html'>('markdown');
  const [includeStatus, setIncludeStatus] = useState(true);
  const [includeCosts, setIncludeCosts] = useState(false);
  const [includeStoryPoints, setIncludeStoryPoints] = useState(false);
  const [includeTimeEstimates, setIncludeTimeEstimates] = useState(false);
  const [includePriority, setIncludePriority] = useState(false);
  const [includeTodoNotes, setIncludeTodoNotes] = useState(false);
  const [includeGlobalNotes, setIncludeGlobalNotes] = useState(false);
  const [exportedText, setExportedText] = useState('');
  const [copied, setCopied] = useState(false);
  
  const { exportToMarkdown, exportToJira, exportToHtml, globalNotes } = useTodoContext();

  // Update exported text when format or include options change
  useEffect(() => {
    let exportText = '';
    
    // Add global notes at the top if selected
    if (includeGlobalNotes && globalNotes) {
      exportText += `${globalNotes}\n\n`;
    }
    
    // Add the todos with selected options
    if (format === 'markdown') {
      exportText += exportToMarkdown(includeStatus, includeCosts, includeStoryPoints, includeTimeEstimates, includePriority, includeTodoNotes);
    } else if (format === 'jira') {
      exportText += exportToJira(includeStatus, includeCosts, includeStoryPoints, includeTimeEstimates, includePriority, includeTodoNotes);
    } else if (format === 'html') {
      exportText += exportToHtml(includeStatus, includeCosts, includeStoryPoints, includeTimeEstimates, includePriority, includeTodoNotes);
    }
    
    setExportedText(exportText);
  }, [
    format, 
    includeStatus, 
    includeCosts, 
    includeStoryPoints, 
    includeTimeEstimates, 
    includePriority, 
    includeTodoNotes, 
    includeGlobalNotes, 
    exportToMarkdown, 
    exportToJira, 
    exportToHtml, 
    globalNotes
  ]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <FileDown className="mr-2 h-4 w-4" />
      Export
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Export Todos</DialogTitle>
          <DialogDescription>
            Export your todos in Markdown, Jira, or HTML format. You can copy the text to use in other applications.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <Tabs defaultValue="markdown" value={format} onValueChange={(value) => setFormat(value as 'markdown' | 'jira' | 'html')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="markdown">Markdown</TabsTrigger>
              <TabsTrigger value="jira">Jira</TabsTrigger>
              <TabsTrigger value="html">HTML</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Content Options</h3>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="include-status" 
                  checked={includeStatus} 
                  onCheckedChange={setIncludeStatus} 
                />
                <Label htmlFor="include-status">
                  Include status {format === 'markdown' ? '([x] or [ ])' : format === 'jira' ? '(✓ or ✗)' : '(checkboxes)'}
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="include-costs" 
                  checked={includeCosts} 
                  onCheckedChange={setIncludeCosts} 
                />
                <Label htmlFor="include-costs">Include costs</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="include-story-points" 
                  checked={includeStoryPoints} 
                  onCheckedChange={setIncludeStoryPoints} 
                />
                <Label htmlFor="include-story-points">Include story points</Label>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">More Options</h3>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="include-time-estimates" 
                  checked={includeTimeEstimates} 
                  onCheckedChange={setIncludeTimeEstimates} 
                />
                <Label htmlFor="include-time-estimates">Include time estimates</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="include-priority" 
                  checked={includePriority} 
                  onCheckedChange={setIncludePriority} 
                />
                <Label htmlFor="include-priority">Include priority</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="include-todo-notes" 
                  checked={includeTodoNotes} 
                  onCheckedChange={setIncludeTodoNotes} 
                />
                <Label htmlFor="include-todo-notes">Include todo notes as footnotes</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="include-global-notes" 
                  checked={includeGlobalNotes} 
                  onCheckedChange={setIncludeGlobalNotes} 
                />
                <Label htmlFor="include-global-notes">Include global notes</Label>
              </div>
            </div>
          </div>
          
          <Textarea
            value={exportedText}
            readOnly
            className="h-[200px] font-mono text-sm"
          />
          
          <div className="text-xs text-muted-foreground">
            <p>Format details:</p>
            {format === 'markdown' ? (
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>Uses - for list items</li>
                <li>Uses indentation (2 spaces) for nesting</li>
                {includeStatus && <li>Uses [x] for completed items and [ ] for incomplete items</li>}
                {includeTodoNotes && <li>Todo notes will be added as footnotes at the end</li>}
                {includeGlobalNotes && <li>Global notes will appear at the top</li>}
              </ul>
            ) : format === 'jira' ? (
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>Uses * (asterisks) for list items</li>
                <li>Uses multiple asterisks for nesting (*, **, ***)</li>
                {includeStatus && <li>Uses (✓) for completed items and (✗) for incomplete items</li>}
                {includeTodoNotes && <li>Todo notes will be added as footnotes at the end</li>}
                {includeGlobalNotes && <li>Global notes will appear at the top</li>}
              </ul>
            ) : (
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>Uses &lt;ul&gt; and &lt;li&gt; tags for list items</li>
                <li>Uses nested &lt;ul&gt; tags for nesting</li>
                {includeStatus && <li>Uses &lt;input type="checkbox"&gt; for status indicators</li>}
                {includeTodoNotes && <li>Todo notes will be added as footnotes at the end</li>}
                {includeGlobalNotes && <li>Global notes will appear at the top</li>}
                <li>Can be pasted directly into HTML editors or emails</li>
              </ul>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          <Button onClick={handleCopy} className="w-24">
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;