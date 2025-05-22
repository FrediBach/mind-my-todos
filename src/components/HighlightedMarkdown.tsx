import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { highlightSearchTerm, convertEmoticonsToEmojis, truncateString } from '@/util/string';
import { cn } from '@/lib/utils';

interface HighlightedMarkdownProps {
  text: string;
  searchTerm?: string;
  className?: string;
  inline?: boolean;
  truncate?: boolean;
  fullMarkdown?: boolean;
}

/**
 * A component that renders Markdown with search term highlighting.
 * Uses a multi-step process:
 * 1. First renders the Markdown to HTML
 * 2. Then applies search term highlighting to the HTML
 * 3. Then converts emoticons to emojis in the HTML (but preserves links)
 * 4. Finally renders the processed HTML using dangerouslySetInnerHTML
 * 
 * Basic Markdown features are always enabled, including:
 * - Bold, italic, and strikethrough formatting
 * - Links
 * 
 * The fullMarkdown prop enables additional Markdown syntax parsing including:
 * - Tables
 * - Task lists
 * - Footnotes
 * - Autolinks
 * - HTML tags
 */
export function HighlightedMarkdown({ 
  text, 
  searchTerm, 
  className, 
  inline = false,
  truncate = false,
  fullMarkdown = false
}: HighlightedMarkdownProps) {
  // Create a ref to hold the rendered markdown
  const markdownRef = React.useRef<HTMLDivElement>(null);
  
  // State to hold the highlighted HTML
  const [highlightedHtml, setHighlightedHtml] = React.useState('');
  
  // Function to render markdown and then highlight search terms
  const renderHighlightedMarkdown = () => {
    if (!markdownRef.current) return;
    
    // Get the HTML content from the hidden markdown renderer
    const renderedHtml = markdownRef.current.innerHTML;
    
    // Apply search term highlighting if a search term is provided
    const highlightedContent = searchTerm && searchTerm.trim() 
      ? highlightSearchTerm(renderedHtml, searchTerm) 
      : renderedHtml;
    
    // Process emoticons to emojis AFTER markdown parsing to avoid breaking links
    const processedContent = convertEmoticonsToEmojis(highlightedContent);
    
    // For inline mode, ensure all elements are displayed inline
    let finalContent = processedContent;
    if (inline) {
      // Replace any block-level elements with inline equivalents
      // This ensures links and other elements don't break to a new line
      finalContent = finalContent
        .replace(/<div/g, '<span')
        .replace(/<\/div>/g, '</span>')
        .replace(/<p/g, '<span')
        .replace(/<\/p>/g, '</span>');
    }
    
    // Update the state with the processed HTML
    setHighlightedHtml(finalContent);
  };
  
  // Effect to re-render when text or search term changes
  React.useEffect(() => {
    renderHighlightedMarkdown();
  }, [text, searchTerm]);
  
  return (
    <>
      {/* Hidden markdown renderer */}
      <div 
        ref={markdownRef} 
        className="hidden"
        style={{ display: 'none' }}
      >
        <ReactMarkdown 
          components={{
            // For inline mode, customize all relevant components to be inline
            ...(inline ? { 
              p: ({node, ...props}) => <span {...props} />,
              a: ({node, ...props}) => <a {...props} style={{display: 'inline'}} />
            } : {})
          }}
          // Always use remarkGfm for strikethrough support, but only use rehypeRaw for fullMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={fullMarkdown ? [rehypeRaw] : []}
        >
          {text}
        </ReactMarkdown>
      </div>
      
      {/* Visible highlighted content */}
      <div 
        className={cn(
          "markdown-content", 
          inline && "inline-markdown",
          truncate && "truncate-text",
          fullMarkdown && "full-markdown",
          className
        )}
        style={{ maxWidth: '100%' }}
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
    </>
  );
}