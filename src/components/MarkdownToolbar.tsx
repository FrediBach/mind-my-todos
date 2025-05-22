import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Bold, Italic, Link, Strikethrough } from 'lucide-react';

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (value: string) => void;
}

export function MarkdownToolbar({ textareaRef, value, onChange }: MarkdownToolbarProps) {
  const applyFormatting = (prefix: string, suffix: string, defaultText?: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || defaultText || '';
    
    const newText = 
      value.substring(0, start) + 
      prefix + textToInsert + suffix + 
      value.substring(end);
    
    // Update React state
    onChange(newText);
    
    // We need to wait for React to update the DOM before we can set the selection
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        
        // If there was no selection, place cursor between the formatting marks
        if (!selectedText && defaultText) {
          textareaRef.current.setSelectionRange(start + prefix.length, start + prefix.length + defaultText.length);
        } else if (!selectedText) {
          textareaRef.current.setSelectionRange(start + prefix.length, start + prefix.length);
        } else {
          // If there was a selection, place cursor after the formatted text
          const newCursorPos = start + prefix.length + textToInsert.length + suffix.length;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }
    }, 0);
  };

  const handleBold = () => {
    applyFormatting('**', '**', 'bold text');
  };

  const handleItalic = () => {
    applyFormatting('*', '*', 'italic text');
  };

  const handleStrikethrough = () => {
    applyFormatting('~~', '~~', 'strikethrough text');
  };

  const handleLink = () => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = value.substring(start, end);

    if (selectedText && selectedText.startsWith('http')) {
      // If selected text is a URL, wrap it in markdown link format with the URL as both text and link
      applyFormatting('[', `](${selectedText})`);
    } else {
      // Otherwise use standard format
      applyFormatting('[', '](https://example.com)', selectedText || 'link text');
    }
  };

  return (
    <div className="flex space-x-1 mb-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8" 
              onClick={handleBold}
              type="button"
            >
              <Bold className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Bold (Ctrl+B)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8" 
              onClick={handleItalic}
              type="button"
            >
              <Italic className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Italic (Ctrl+I)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8" 
              onClick={handleStrikethrough}
              type="button"
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Strikethrough</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8" 
              onClick={handleLink}
              type="button"
            >
              <Link className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Insert Link (Ctrl+K)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}