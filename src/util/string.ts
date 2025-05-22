/**
 * Capitalizes the first letter of each word in a string.
 * @param str The input string to be capitalized.
 * @returns A new string with the first letter of each word capitalized.
 */
export function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
* Truncates a string to a specified length and adds an ellipsis if truncated.
* @param str The input string to be truncated.
* @param maxLength The maximum length of the truncated string (including ellipsis).
* @returns A truncated string with ellipsis if necessary.
*/
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
      return str;
  }
  return str.slice(0, maxLength - 3) + '...';
}

/**
* Removes all whitespace from a string.
* @param str The input string to remove whitespace from.
* @returns A new string with all whitespace removed.
*/
export function removeWhitespace(str: string): string {
  return str.replace(/\s/g, '');
}

/**
 * Mapping of common text emoticons to their Unicode emoji equivalents.
 */
const emoticonMap: Record<string, string> = {
  // Smileys
  ':-)': '😊',
  ':)': '🙂',
  ':-D': '😀',
  ':D': '😁',
  ';-)': '😉',
  ';)': '😉',
  ':-P': '😛',
  ':P': '😛',
  ':p': '😛',
  ':-p': '😛',
  ':-O': '😮',
  ':O': '😮',
  ':o': '😮',
  ':-o': '😮',
  
  // Sad faces
  ':-(': '😞',
  ':(': '😔',
  ':-[': '😟',
  ':[': '😟',
  ':-<': '😢',
  ':<': '😢',
  
  // Other emotions
  ':-|': '😐',
  ':|': '😐',
  ':-/': '😕',
  ':/': '😕',
  ':-\\': '😕',
  ':\\': '😕',
  ':\'(': '😢',
  ':\'-(': '😢',
  ':*)': '😊',
  ':-*': '😘',
  ':*': '😘',
  
  // Special
  '<3': '❤️',
  '</3': '💔',
  '(y)': '👍',
  '(n)': '👎',
  '(Y)': '👍',
  '(N)': '👎',
  ':-S': '😖',
  ':S': '😖',
  ':-s': '😖',
  ':s': '😖',
  '8-)': '😎',
  '8)': '😎',
  'B-)': '😎',
  'B)': '😎',
  'O:-)': '😇',
  'O:)': '😇',
  '0:-)': '😇',
  '0:)': '😇',
  '>:-(': '😠',
  '>:(': '😠',
  '>:-)': '😈',
  '>:)': '😈',
  ':-$': '😳',
  ':$': '😳',
};

/**
 * Converts text emoticons to Unicode emoji equivalents.
 * If the input contains HTML, it will only convert emoticons in text nodes,
 * preserving content inside HTML tags like links.
 * 
 * @param text The input text containing emoticons.
 * @returns A new string with emoticons converted to emojis.
 */
export function convertEmoticonsToEmojis(text: string): string {
  if (!text) return text;
  
  // Check if the text contains HTML
  const containsHtml = /<[a-z][\s\S]*>/i.test(text);
  
  if (!containsHtml) {
    // Simple case: no HTML, just do direct replacement
    let result = text;
    
    // Replace each emoticon with its emoji equivalent
    Object.entries(emoticonMap).forEach(([emoticon, emoji]) => {
      // Use a global regex to replace all occurrences
      // Need to escape special regex characters in the emoticon
      const escapedEmoticon = emoticon.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
      const regex = new RegExp(escapedEmoticon, 'g');
      result = result.replace(regex, emoji);
    });
    
    return result;
  } else {
    // Complex case: HTML content - need to parse and only replace in text nodes
    
    // Split the text into segments: HTML tags and text content
    // This regex captures HTML tags as one group and text between tags as another
    const segments = text.split(/(<[^>]*>)/g);
    
    // Process each segment
    const processedSegments = segments.map(segment => {
      // If segment starts with < and ends with >, it's an HTML tag - leave it alone
      if (segment.startsWith('<') && segment.endsWith('>')) {
        return segment;
      }
      
      // Otherwise, it's text content - replace emoticons
      let result = segment;
      Object.entries(emoticonMap).forEach(([emoticon, emoji]) => {
        const escapedEmoticon = emoticon.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
        const regex = new RegExp(escapedEmoticon, 'g');
        result = result.replace(regex, emoji);
      });
      
      return result;
    });
    
    // Join the segments back together
    return processedSegments.join('');
  }
}

/**
 * Highlights search terms in text by wrapping them in a span with a highlight class.
 * This function is designed to be used with dangerouslySetInnerHTML.
 * It only searches and highlights text content, not HTML tags.
 * 
 * @param text The input text to search within.
 * @param searchTerm The search term to highlight.
 * @returns A string with HTML markup for highlighting search terms.
 */
export function highlightSearchTerm(text: string, searchTerm: string): string {
  if (!text || !searchTerm || searchTerm.trim() === '') {
    return text;
  }
  
  // Escape special regex characters in the search term
  const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Check if the text contains HTML
  const containsHtml = /<[a-z][\s\S]*>/i.test(text);
  
  if (!containsHtml) {
    // Simple case: no HTML, just do direct replacement
    // Create a regex that matches the search term case-insensitively
    const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
    
    // Replace matches with highlighted spans
    return text.replace(regex, '<span class="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">$1</span>');
  } else {
    // Complex case: HTML content - need to parse and only replace in text nodes
    
    // Split the text into segments: HTML tags and text content
    // This regex captures HTML tags as one group and text between tags as another
    const segments = text.split(/(<[^>]*>)/g);
    
    // Process each segment
    const processedSegments = segments.map(segment => {
      // If segment starts with < and ends with >, it's an HTML tag - leave it alone
      if (segment.startsWith('<') && segment.endsWith('>')) {
        return segment;
      }
      
      // Otherwise, it's text content - highlight search terms
      const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
      return segment.replace(regex, '<span class="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">$1</span>');
    });
    
    // Join the segments back together
    return processedSegments.join('');
  }
}
