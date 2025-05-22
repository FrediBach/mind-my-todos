import jira2md from 'jira2md';

/**
 * Converts HTML list markup to Markdown format
 * Supports both ordered (ol) and unordered (ul) lists with proper nesting
 */
export function convertHtmlToMarkdown(html: string): string {
  // Create a DOM parser to parse the HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Function to process inline formatting
  const processTextContent = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();
      let content = '';
      
      // Process all child nodes and collect their text
      for (let i = 0; i < node.childNodes.length; i++) {
        content += processTextContent(node.childNodes[i]);
      }
      
      // Apply Markdown formatting based on HTML tags
      switch (tagName) {
        case 'strong':
        case 'b':
          return `**${content}**`;
        case 'em':
        case 'i':
          return `*${content}*`;
        case 'code':
          return `\`${content}\``;
        case 'del':
        case 's':
          return `~~${content}~~`;
        case 'a':
          const href = (element as HTMLAnchorElement).getAttribute('href');
          return `[${content}](${href})`;
        case 'input':
          // Handle checkboxes
          if (element.getAttribute('type') === 'checkbox') {
            const isChecked = (element as HTMLInputElement).checked;
            return isChecked ? '[x] ' : '[ ] ';
          }
          return content;
        default:
          return content;
      }
    }
    
    return '';
  };
  
  // Function to process a list (ul or ol)
  const processListToMarkdown = (listElement: Element, level: number = 0): string => {
    let markdown = '';
    const isOrdered = listElement.tagName.toLowerCase() === 'ol';
    let counter = 1;
    
    // Process each list item
    for (let i = 0; i < listElement.children.length; i++) {
      const item = listElement.children[i];
      
      if (item.tagName.toLowerCase() === 'li') {
        const indent = '  '.repeat(level);
        const prefix = isOrdered ? `${counter}. ` : '- ';
        
        // Process the content of the list item
        let itemContent = '';
        let hasNestedList = false;
        
        // First, process all text nodes and non-list elements to get the item's text content
        for (let j = 0; j < item.childNodes.length; j++) {
          const childNode = item.childNodes[j];
          
          if (childNode.nodeType === Node.ELEMENT_NODE) {
            const childElement = childNode as Element;
            const childTagName = childElement.tagName.toLowerCase();
            
            if (childTagName !== 'ul' && childTagName !== 'ol') {
              itemContent += processTextContent(childElement);
            }
          } else {
            itemContent += processTextContent(childNode);
          }
        }
        
        // Add the list item to the markdown
        markdown += `${indent}${prefix}${itemContent.trim()}\n`;
        
        // Then, process any nested lists
        for (let j = 0; j < item.childNodes.length; j++) {
          const childNode = item.childNodes[j];
          
          if (childNode.nodeType === Node.ELEMENT_NODE) {
            const childElement = childNode as Element;
            const childTagName = childElement.tagName.toLowerCase();
            
            if (childTagName === 'ul' || childTagName === 'ol') {
              hasNestedList = true;
              // Process the nested list with increased indentation
              markdown += processListToMarkdown(childElement, level + 1);
            }
          }
        }
        
        // If there was no nested list but the content has newlines,
        // ensure they're properly indented
        if (!hasNestedList && itemContent.includes('\n')) {
          const indentNextLevel = '  '.repeat(level + 1);
          markdown = markdown.replace(/\n([^\n])/g, `\n${indentNextLevel}$1`);
        }
        
        counter++;
      }
    }
    
    return markdown;
  };
  
  let markdown = '';
  
  // Find all lists in the document - both top-level and nested
  const allLists = doc.querySelectorAll('ul, ol');
  
  // Find only top-level lists (not nested within other lists)
  const topLevelLists: Element[] = [];
  allLists.forEach(list => {
    let parent = list.parentElement;
    while (parent && parent !== doc.body) {
      if (parent.tagName.toLowerCase() === 'ul' || parent.tagName.toLowerCase() === 'ol') {
        // This is a nested list, not a top-level one
        return;
      }
      parent = parent.parentElement;
    }
    // If we get here, this is a top-level list
    topLevelLists.push(list);
  });
  
  if (topLevelLists.length > 0) {
    // Process each top-level list
    for (let i = 0; i < topLevelLists.length; i++) {
      markdown += processListToMarkdown(topLevelLists[i]);
      
      // Add a newline between lists
      if (i < topLevelLists.length - 1) {
        markdown += '\n';
      }
    }
  } else {
    // If no lists were found, try to extract content from div or p elements
    // This helps with pasted content that might not be in list format but has line breaks
    const content = doc.body.innerHTML
      .replace(/<div>/g, '\n')
      .replace(/<\/div>/g, '')
      .replace(/<p>/g, '\n')
      .replace(/<\/p>/g, '')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/&nbsp;/g, ' ');
    
    // Create a temporary element to strip HTML tags
    const tempElement = document.createElement('div');
    tempElement.innerHTML = content;
    
    // Convert the content to a list format if it has line breaks
    const lines = tempElement.textContent?.split('\n').filter(line => line.trim()) || [];
    
    if (lines.length > 0) {
      markdown = lines.map(line => `- ${line.trim()}`).join('\n');
    }
  }
  
  return markdown.trim();
}

/**
 * Converts Jira markup to Markdown format and cleans up any unsupported formatting
 */
export function convertJiraToMarkdown(jiraMarkup: string): string {
  // Convert Jira to Markdown using jira2md
  let markdown = jira2md.to_markdown(jiraMarkup);
  
  // Clean up any formatting that doesn't have Markdown equivalents
  // For example, Jira has some formatting like {color} that doesn't exist in Markdown
  
  // Remove color tags: {color:#hexcode}text{color}
  markdown = markdown.replace(/\{color:[^}]*\}(.*?)\{color\}/g, '$1');
  
  // Remove panel tags: {panel}content{panel} - using workaround for the 's' flag
  markdown = markdown.replace(/\{panel[^}]*\}([\s\S]*?)\{panel\}/g, '$1');
  
  // Remove status tags: {status}content{status}
  markdown = markdown.replace(/\{status[^}]*\}(.*?)\{status\}/g, '$1');
  
  // Remove other Jira-specific formatting that has no Markdown equivalent
  markdown = markdown.replace(/\{[^}]*\}(.*?)\{[^}]*\}/g, '$1');
  
  return markdown;
}

/**
 * Parses Markdown list text into a nested structure that can be converted to todos
 * Supports both unordered lists (-, *, +) and ordered lists (1., 2., etc.)
 */
export interface MarkdownListItem {
  text: string;
  children: MarkdownListItem[];
  level: number;
  completed?: boolean;
}

export function parseMarkdownList(markdown: string): MarkdownListItem[] {
  const lines = markdown.split('\n').filter(line => line.trim() !== '');
  const result: MarkdownListItem[] = [];
  const stack: MarkdownListItem[] = [];
  
  // Regular expression to match list items with indentation
  // Matches: whitespace + (-, *, +, or number followed by .) + whitespace + content
  const listItemRegex = /^(\s*)(?:[-*+]|\d+\.)\s+(.+)$/;
  
  lines.forEach(line => {
    const match = line.match(listItemRegex);
    
    if (match) {
      const indentation = match[1].length;
      let content = match[2].trim();
      const level = Math.floor(indentation / 2); // Assuming 2 spaces per level
      
      // Check for status indicators
      let completed: boolean | undefined = undefined;
      
      // Check for Markdown style status: [x] or [ ]
      const statusMatch = content.match(/^\[([ xX])\]\s+(.+)$/);
      if (statusMatch) {
        completed = statusMatch[1].toLowerCase() === 'x';
        content = statusMatch[2];
      }
      
      // Check for Jira style status: (✓) or (✗)
      const jiraStatusMatch = content.match(/^[\(（]([✓✗✅❌☑️☒]|✓|✗)[\)）]\s+(.+)$/);
      if (jiraStatusMatch) {
        completed = ['✓', '✅', '☑️'].includes(jiraStatusMatch[1]);
        content = jiraStatusMatch[2];
      }
      
      const newItem: MarkdownListItem = {
        text: content,
        children: [],
        level,
        completed,
      };
      
      // Find the appropriate parent based on indentation level
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }
      
      if (stack.length === 0) {
        // This is a top-level item
        result.push(newItem);
      } else {
        // This is a child item
        stack[stack.length - 1].children.push(newItem);
      }
      
      stack.push(newItem);
    }
  });
  
  return result;
}

/**
 * Flattens a nested MarkdownListItem structure into a format suitable for importing
 * into the TodoContext
 */
export interface FlattenedTodo {
  text: string;
  parentId: string | null;
  completed?: boolean;
}

export function flattenMarkdownList(
  items: MarkdownListItem[],
  parentId: string | null = null,
  result: FlattenedTodo[] = []
): FlattenedTodo[] {
  items.forEach(item => {
    result.push({
      text: item.text,
      parentId,
      completed: item.completed,
    });
    
    const currentId = `temp-${result.length - 1}`;
    
    if (item.children.length > 0) {
      flattenMarkdownList(item.children, currentId, result);
    }
  });
  
  return result;
}

/**
 * Interface for TodoItem used in export functions
 */
export interface TodoItemForExport {
  id: string;
  text: string;
  completed: boolean;
  children: TodoItemForExport[];
  collapsed?: boolean;
  parentId?: string | null;
  note?: string;
  cost?: number | null;
  timeEstimate?: number | null;
  storyPoints?: number | null;
  priority?: 'blocker' | 'important' | 'low' | 'lowest' | null;
}

/**
 * Converts todos to Markdown format
 * @param todos The todos to convert
 * @param includeStatus Whether to include status indicators ([x] or [ ])
 * @param includeCosts Whether to include costs
 * @param includeStoryPoints Whether to include story points
 * @param includeTimeEstimates Whether to include time estimates
 * @param includePriority Whether to include priority
 * @param includeTodoNotes Whether to include todo notes as footnotes
 * @returns Markdown formatted string
 */
export function convertTodosToMarkdown(
  todos: TodoItemForExport[],
  includeStatus: boolean = false,
  includeCosts: boolean = false,
  includeStoryPoints: boolean = false,
  includeTimeEstimates: boolean = false,
  includePriority: boolean = false,
  includeTodoNotes: boolean = false
): string {
  // Keep track of footnotes
  const footnotes: { id: string; text: string; note: string }[] = [];
  
  const convertItem = (
    item: TodoItemForExport,
    level: number = 0
  ): string => {
    const indent = '  '.repeat(level);
    const statusPrefix = includeStatus
      ? item.completed
        ? '[x] '
        : '[ ] '
      : '';
    
    // Build metadata string
    let metadata = '';
    
    if (includeCosts && item.cost !== undefined && item.cost !== null) {
      metadata += ` [Cost: ${item.cost}]`;
    }
    
    if (includeStoryPoints && item.storyPoints !== undefined && item.storyPoints !== null) {
      metadata += ` [SP: ${item.storyPoints}]`;
    }
    
    if (includeTimeEstimates && item.timeEstimate !== undefined && item.timeEstimate !== null) {
      // Convert seconds to a readable format
      const hours = Math.floor(item.timeEstimate / 3600);
      const minutes = Math.floor((item.timeEstimate % 3600) / 60);
      let timeString = '';
      
      if (hours > 0) {
        timeString += `${hours}h`;
      }
      
      if (minutes > 0 || (hours === 0 && minutes === 0)) {
        timeString += `${minutes}m`;
      }
      
      metadata += ` [Est: ${timeString}]`;
    }
    
    if (includePriority && item.priority) {
      const priorityLabels: Record<string, string> = {
        'blocker': 'BLOCKER',
        'important': 'HIGH',
        'low': 'LOW',
        'lowest': 'LOWEST'
      };
      
      metadata += ` [Priority: ${priorityLabels[item.priority] || item.priority}]`;
    }
    
    // Add footnote reference if there's a note
    let footnoteRef = '';
    if (includeTodoNotes && item.note) {
      const footnoteId = `fn${footnotes.length + 1}`;
      footnotes.push({
        id: footnoteId,
        text: item.text,
        note: item.note
      });
      footnoteRef = ` [^${footnoteId}]`;
    }
    
    const line = `${indent}- ${statusPrefix}${item.text}${metadata}${footnoteRef}`;
    
    if (item.children.length === 0) {
      return line;
    }
    
    const childrenText = item.children
      .map(child => convertItem(child, level + 1))
      .join('\n');
    
    return `${line}\n${childrenText}`;
  };
  
  let result = todos.map(todo => convertItem(todo)).join('\n');
  
  // Add footnotes if any
  if (includeTodoNotes && footnotes.length > 0) {
    result += '\n\n';
    footnotes.forEach(fn => {
      result += `[^${fn.id}]: **${fn.text}** - ${fn.note}\n`;
    });
  }
  
  return result;
}

/**
 * Converts todos to Jira format
 * @param todos The todos to convert
 * @param includeStatus Whether to include status indicators (✓ or ✗)
 * @param includeCosts Whether to include costs
 * @param includeStoryPoints Whether to include story points
 * @param includeTimeEstimates Whether to include time estimates
 * @param includePriority Whether to include priority
 * @param includeTodoNotes Whether to include todo notes as footnotes
 * @returns Jira formatted string
 */
export function convertTodosToJira(
  todos: TodoItemForExport[],
  includeStatus: boolean = false,
  includeCosts: boolean = false,
  includeStoryPoints: boolean = false,
  includeTimeEstimates: boolean = false,
  includePriority: boolean = false,
  includeTodoNotes: boolean = false
): string {
  // Keep track of footnotes
  const footnotes: { id: string; text: string; note: string }[] = [];
  
  const convertItem = (
    item: TodoItemForExport,
    level: number = 0
  ): string => {
    const prefix = '*'.repeat(level + 1);
    const statusPrefix = includeStatus
      ? item.completed
        ? '(✓) '
        : '(✗) '
      : '';
    
    // Build metadata string
    let metadata = '';
    
    if (includeCosts && item.cost !== undefined && item.cost !== null) {
      metadata += ` {color:blue}[Cost: ${item.cost}]{color}`;
    }
    
    if (includeStoryPoints && item.storyPoints !== undefined && item.storyPoints !== null) {
      metadata += ` {color:green}[SP: ${item.storyPoints}]{color}`;
    }
    
    if (includeTimeEstimates && item.timeEstimate !== undefined && item.timeEstimate !== null) {
      // Convert seconds to a readable format
      const hours = Math.floor(item.timeEstimate / 3600);
      const minutes = Math.floor((item.timeEstimate % 3600) / 60);
      let timeString = '';
      
      if (hours > 0) {
        timeString += `${hours}h`;
      }
      
      if (minutes > 0 || (hours === 0 && minutes === 0)) {
        timeString += `${minutes}m`;
      }
      
      metadata += ` {color:purple}[Est: ${timeString}]{color}`;
    }
    
    if (includePriority && item.priority) {
      const priorityColors: Record<string, string> = {
        'blocker': 'red',
        'important': 'orange',
        'low': 'blue',
        'lowest': 'gray'
      };
      
      const priorityLabels: Record<string, string> = {
        'blocker': 'BLOCKER',
        'important': 'HIGH',
        'low': 'LOW',
        'lowest': 'LOWEST'
      };
      
      const color = priorityColors[item.priority] || 'black';
      metadata += ` {color:${color}}[Priority: ${priorityLabels[item.priority] || item.priority}]{color}`;
    }
    
    // Add footnote reference if there's a note
    let footnoteRef = '';
    if (includeTodoNotes && item.note) {
      const footnoteId = footnotes.length + 1;
      footnotes.push({
        id: footnoteId.toString(),
        text: item.text,
        note: item.note
      });
      footnoteRef = ` [^${footnoteId}]`;
    }
    
    const line = `${prefix} ${statusPrefix}${item.text}${metadata}${footnoteRef}`;
    
    if (item.children.length === 0) {
      return line;
    }
    
    const childrenText = item.children
      .map(child => convertItem(child, level + 1))
      .join('\n');
    
    return `${line}\n${childrenText}`;
  };
  
  let result = todos.map(todo => convertItem(todo)).join('\n');
  
  // Add footnotes if any
  if (includeTodoNotes && footnotes.length > 0) {
    result += '\n\n';
    footnotes.forEach(fn => {
      result += `[^${fn.id}]: *${fn.text}* - ${fn.note}\n`;
    });
  }
  
  return result;
}

/**
 * Converts todos to HTML format
 * @param todos The todos to convert
 * @param includeStatus Whether to include status indicators (checkboxes)
 * @param includeCosts Whether to include costs
 * @param includeStoryPoints Whether to include story points
 * @param includeTimeEstimates Whether to include time estimates
 * @param includePriority Whether to include priority
 * @param includeTodoNotes Whether to include todo notes as footnotes
 * @returns HTML formatted string
 */
export function convertTodosToHtml(
  todos: TodoItemForExport[],
  includeStatus: boolean = false,
  includeCosts: boolean = false,
  includeStoryPoints: boolean = false,
  includeTimeEstimates: boolean = false,
  includePriority: boolean = false,
  includeTodoNotes: boolean = false
): string {
  // Keep track of footnotes
  const footnotes: { id: string; text: string; note: string }[] = [];
  
  const convertItem = (
    item: TodoItemForExport,
    isOrdered: boolean = false
  ): string => {
    // Process the item's text to handle any special characters
    const escapeHtml = (text: string): string => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };
    
    // Create the status indicator if needed
    const statusHtml = includeStatus
      ? item.completed
        ? '<input type="checkbox" checked disabled> '
        : '<input type="checkbox" disabled> '
      : '';
    
    // Build metadata HTML
    let metadataHtml = '';
    
    if (includeCosts && item.cost !== undefined && item.cost !== null) {
      metadataHtml += ` <span style="color: blue;">[Cost: ${item.cost}]</span>`;
    }
    
    if (includeStoryPoints && item.storyPoints !== undefined && item.storyPoints !== null) {
      metadataHtml += ` <span style="color: green;">[SP: ${item.storyPoints}]</span>`;
    }
    
    if (includeTimeEstimates && item.timeEstimate !== undefined && item.timeEstimate !== null) {
      // Convert seconds to a readable format
      const hours = Math.floor(item.timeEstimate / 3600);
      const minutes = Math.floor((item.timeEstimate % 3600) / 60);
      let timeString = '';
      
      if (hours > 0) {
        timeString += `${hours}h`;
      }
      
      if (minutes > 0 || (hours === 0 && minutes === 0)) {
        timeString += `${minutes}m`;
      }
      
      metadataHtml += ` <span style="color: purple;">[Est: ${timeString}]</span>`;
    }
    
    if (includePriority && item.priority) {
      const priorityColors: Record<string, string> = {
        'blocker': 'red',
        'important': 'orange',
        'low': 'blue',
        'lowest': 'gray'
      };
      
      const priorityLabels: Record<string, string> = {
        'blocker': 'BLOCKER',
        'important': 'HIGH',
        'low': 'LOW',
        'lowest': 'LOWEST'
      };
      
      const color = priorityColors[item.priority] || 'black';
      metadataHtml += ` <span style="color: ${color};">[Priority: ${priorityLabels[item.priority] || item.priority}]</span>`;
    }
    
    // Add footnote reference if there's a note
    let footnoteHtml = '';
    if (includeTodoNotes && item.note) {
      const footnoteId = `fn${footnotes.length + 1}`;
      footnotes.push({
        id: footnoteId,
        text: item.text,
        note: item.note
      });
      footnoteHtml = ` <sup><a href="#${footnoteId}">[${footnotes.length}]</a></sup>`;
    }
    
    // Create the list item with its content
    let itemHtml = `<li>${statusHtml}${escapeHtml(item.text)}${metadataHtml}${footnoteHtml}`;
    
    // Add children if there are any
    if (item.children.length > 0) {
      // Determine if the children should be in an ordered or unordered list
      // For simplicity, we'll use the same type for all children of this item
      const childListType = isOrdered ? 'ol' : 'ul';
      
      // Create the nested list with all children
      const childrenHtml = item.children
        .map(child => convertItem(child, isOrdered))
        .join('\n');
      
      itemHtml += `\n  <${childListType}>\n    ${childrenHtml}\n  </${childListType}>`;
    }
    
    // Close the list item
    itemHtml += '</li>';
    
    return itemHtml;
  };
  
  // Helper function to escape HTML
  const escapeHtml = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Create the top-level list (unordered by default)
  const listItems = todos.map(todo => convertItem(todo, false)).join('\n');
  let result = `<ul>\n  ${listItems}\n</ul>`;
  
  // Add footnotes if any
  if (includeTodoNotes && footnotes.length > 0) {
    result += '\n\n<hr>\n<ol class="footnotes">\n';
    footnotes.forEach(fn => {
      result += `  <li id="${fn.id}"><strong>${escapeHtml(fn.text)}</strong> - ${escapeHtml(fn.note)}</li>\n`;
    });
    result += '</ol>';
  }
  
  return result;
}