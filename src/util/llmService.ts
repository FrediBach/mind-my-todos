import { LlmConfig, PromptTemplate } from '@/contexts/LlmContext';
import { TodoItem } from '@/contexts/TodoContext';

// Response types for different LLM operations
export interface CleanupTodoResponse {
  text: string;
  explanation?: string;
}

export interface SuggestTodosResponse {
  todos: {
    text: string;
    explanation?: string;
  }[];
}

export interface GenerateTodosResponse {
  todos: {
    text: string;
    children?: {
      text: string;
    }[];
  }[];
}

export interface ExplainTodoResponse {
  explanation: string;
  relevance: {
    globalNotes?: string;
    relatedTodos?: string[];
  };
}

// Main interface for LLM service responses
export interface LlmResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Process a template string by replacing variables with actual values
 */
export function processTemplate(template: string, variables: Record<string, any>): string {
  let processed = template;
  
  // Process conditional blocks first (e.g., {{#globalNotes}}...{{/globalNotes}})
  Object.keys(variables).forEach(key => {
    const openTag = `{{#${key}}}`;
    const closeTag = `{{/${key}}}`;
    
    if (processed.includes(openTag) && processed.includes(closeTag)) {
      const regex = new RegExp(`${openTag}([\s\S]*?)${closeTag}`, 'g');
      
      if (variables[key]) {
        // If the variable exists and is truthy, keep the content but remove the tags
        processed = processed.replace(regex, (_, content) => {
          return content;
        });
      } else {
        // If the variable doesn't exist or is falsy, remove the entire block
        processed = processed.replace(regex, '');
      }
    }
  });
  
  // Then replace individual variables
  Object.keys(variables).forEach(key => {
    const placeholder = `{{${key}}}`;
    if (processed.includes(placeholder)) {
      processed = processed.replace(new RegExp(placeholder, 'g'), variables[key] || '');
    }
  });
  
  return processed;
}

/**
 * Call the LLM API with the given prompt and configuration
 */
export async function callLlmApi<T>(
  prompt: string,
  config: LlmConfig,
  systemPrompt: string = 'You are a helpful assistant.'
): Promise<LlmResponse<T>> {
  try {
    // Determine the endpoint to use (local or remote)
    const endpoint = config.useLocalLlm 
      ? `http://${config.localServer}:${config.localPort}${config.localApiPath}`
      : config.apiEndpoint;
    
    // Set up headers based on whether we're using a local LLM or not
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Only add Authorization header if we're not using a local LLM or if API key is provided
    if (!config.useLocalLlm || config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: config.temperature
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error?.message || `API error: ${response.status}`
      };
    }

    const data = await response.json();
    
    try {
      // Extract the content from the response
      const content = data.choices[0].message.content;
      
      // Parse the JSON from the content
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                        content.match(/{[\s\S]*}/);
                        
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
      const parsedData = JSON.parse(jsonString);
      
      return {
        success: true,
        data: parsedData as T
      };
    } catch (parseError) {
      console.error('Failed to parse LLM response:', parseError);
      return {
        success: false,
        error: 'Failed to parse response from LLM'
      };
    }
  } catch (error) {
    console.error('LLM API call failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Clean up a single todo using the LLM
 */
export async function cleanupTodo(
  todo: TodoItem,
  globalNotes: string,
  listContext: TodoItem[],
  config: LlmConfig,
  template?: PromptTemplate
): Promise<LlmResponse<CleanupTodoResponse>> {
  // Use the provided template or find the active template for cleanup
  const cleanupTemplate = template || config.promptTemplates.find(
    t => t.id === config.activeTemplateIds.cleanup
  );
  
  if (!cleanupTemplate) {
    return {
      success: false,
      error: 'No prompt template found for cleanup'
    };
  }
  
  // Prepare variables for template processing
  const listContextText = listContext
    .map(item => `- ${item.text}`)
    .join('\n');
  
  const variables = {
    todoText: todo.text,
    globalNotes,
    listContext: listContext.length > 0,
    listContextText
  };
  
  // Process the template
  const prompt = processTemplate(cleanupTemplate.userPrompt, variables);
  const systemPrompt = cleanupTemplate.systemPrompt;
  
  return callLlmApi<CleanupTodoResponse>(prompt, config, systemPrompt);
}

/**
 * Suggest new todos based on the current list
 */
export async function suggestTodos(
  todos: TodoItem[],
  globalNotes: string,
  config: LlmConfig,
  template?: PromptTemplate
): Promise<LlmResponse<SuggestTodosResponse>> {
  // Use the provided template or find the active template for suggestions
  const suggestTemplate = template || config.promptTemplates.find(
    t => t.id === config.activeTemplateIds.suggest
  );
  
  if (!suggestTemplate) {
    return {
      success: false,
      error: 'No prompt template found for suggestions'
    };
  }
  
  // Prepare variables for template processing
  const todosText = todos
    .map(item => `- ${item.text}${item.completed ? ' (completed)' : ''}`)
    .join('\n');
  
  const variables = {
    todosText,
    globalNotes
  };
  
  // Process the template
  const prompt = processTemplate(suggestTemplate.userPrompt, variables);
  const systemPrompt = suggestTemplate.systemPrompt;
  
  return callLlmApi<SuggestTodosResponse>(prompt, config, systemPrompt);
}

/**
 * Generate todos from a description using the LLM
 */
export async function generateTodosFromDescription(
  description: string,
  globalNotes: string,
  config: LlmConfig,
  template?: PromptTemplate
): Promise<LlmResponse<GenerateTodosResponse>> {
  // Use the provided template or find the active template for generation
  const generateTemplate = template || config.promptTemplates.find(
    t => t.id === config.activeTemplateIds.generate
  );
  
  if (!generateTemplate) {
    return {
      success: false,
      error: 'No prompt template found for generation'
    };
  }
  
  // Prepare variables for template processing
  const variables = {
    description,
    globalNotes
  };
  
  // Process the template
  const prompt = processTemplate(generateTemplate.userPrompt, variables);
  const systemPrompt = generateTemplate.systemPrompt;
  
  return callLlmApi<GenerateTodosResponse>(prompt, config, systemPrompt);
}

/**
 * Explain a todo in relation to global notes and other todos
 */
export async function explainTodo(
  todo: TodoItem,
  globalNotes: string,
  allTodos: TodoItem[],
  config: LlmConfig,
  template?: PromptTemplate
): Promise<LlmResponse<ExplainTodoResponse>> {
  // Use the provided template or find the active template for explanation
  const explainTemplate = template || config.promptTemplates.find(
    t => t.id === config.activeTemplateIds.explain
  );
  
  if (!explainTemplate) {
    return {
      success: false,
      error: 'No prompt template found for explanation'
    };
  }
  
  // Get all todos except the current one
  const otherTodos = allTodos.filter(item => item.id !== todo.id);
  const otherTodosText = otherTodos
    .map(item => `- ${item.text}${item.completed ? ' (completed)' : ''}`)
    .join('\n');
  
  // Prepare variables for template processing
  const variables = {
    todoText: todo.text,
    globalNotes,
    otherTodos: otherTodos.length > 0,
    otherTodosText
  };
  
  // Process the template
  const prompt = processTemplate(explainTemplate.userPrompt, variables);
  const systemPrompt = explainTemplate.systemPrompt;
  
  return callLlmApi<ExplainTodoResponse>(prompt, config, systemPrompt);
}