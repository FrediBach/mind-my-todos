import React, { createContext, useContext, useState, useEffect } from 'react';

export interface PromptTemplate {
  id: string;
  name: string;
  systemPrompt: string;
  userPrompt: string;
  description?: string;
}

export interface LlmConfig {
  apiKey: string;
  apiEndpoint: string;
  model: string;
  temperature: number;
  useLocalLlm: boolean;
  localServer: string;
  localPort: string;
  localApiPath: string;
  promptTemplates: PromptTemplate[];
  activeTemplateIds: {
    cleanup: string;
    suggest: string;
    explain: string;
    generate: string;
  };
}

interface LlmContextType {
  config: LlmConfig;
  updateConfig: (newConfig: Partial<LlmConfig>) => void;
  isConfigured: boolean;
  effectiveEndpoint: string;
  getPromptTemplate: (type: keyof LlmConfig['activeTemplateIds']) => PromptTemplate | undefined;
  addPromptTemplate: (template: Omit<PromptTemplate, 'id'>) => void;
  updatePromptTemplate: (template: PromptTemplate) => void;
  deletePromptTemplate: (id: string) => void;
  setActiveTemplate: (type: keyof LlmConfig['activeTemplateIds'], templateId: string) => void;
}

// Default prompt templates
const defaultPromptTemplates: PromptTemplate[] = [
  {
    id: 'default-cleanup',
    name: 'Default Cleanup',
    systemPrompt: 'You are an AI assistant that helps improve todo items to make them clearer and more actionable.',
    userPrompt: `
I need help improving the following todo item:

"{{todoText}}"

{{#globalNotes}}Context from global notes:\n{{globalNotes}}\n{{/globalNotes}}

{{#listContext}}Other items in this list:\n{{listContextText}}\n{{/listContext}}

Please provide a clearer, more actionable version of this todo item.

Return your response in the following JSON format:
\`\`\`json
{
  "text": "Improved todo text",
  "explanation": "Brief explanation of changes made"
}
\`\`\`
`,
    description: 'Default template for cleaning up todo items'
  },
  {
    id: 'default-suggest',
    name: 'Default Suggest',
    systemPrompt: 'You are an AI assistant that helps suggest relevant todo items based on existing tasks.',
    userPrompt: `
I have the following todo list:

{{todosText}}

{{#globalNotes}}Context from global notes:\n{{globalNotes}}\n{{/globalNotes}}

Based on this list, please suggest 3-5 additional todo items that would help complete this project or task.

Return your response in the following JSON format:
\`\`\`json
{
  "todos": [
    {
      "text": "Suggested todo item 1",
      "explanation": "Why this would be helpful"
    },
    {
      "text": "Suggested todo item 2",
      "explanation": "Why this would be helpful"
    }
  ]
}
\`\`\`
`,
    description: 'Default template for suggesting new todo items'
  },
  {
    id: 'default-explain',
    name: 'Default Explain',
    systemPrompt: 'You are an AI assistant that helps explain todo items in the context of a larger project or task list.',
    userPrompt: `
I need help understanding the following todo item in context:

"{{todoText}}"

{{#globalNotes}}Global notes for the project:\n{{globalNotes}}\n\n{{/globalNotes}}

{{#otherTodos}}Other todos in the project:\n{{otherTodosText}}\n\n{{/otherTodos}}

Please explain this todo item in relation to the global notes and other todos. Help me understand:
1. What this todo means in the context of the overall project
2. How it relates to other todos
3. Why it might be important
4. Any dependencies or prerequisites

Return your response in the following JSON format:
\`\`\`json
{
  "explanation": "Detailed explanation of the todo in context",
  "relevance": {
    "globalNotes": "How this relates to information in the global notes (if applicable)",
    "relatedTodos": ["Todo 1 that relates to this", "Todo 2 that relates to this"]
  }
}
\`\`\`
`,
    description: 'Default template for explaining todo items'
  },
  {
    id: 'default-generate',
    name: 'Default Generate',
    systemPrompt: 'You are an AI assistant that helps break down tasks and projects into actionable todo items.',
    userPrompt: `
I need help breaking down the following task or project into actionable todo items:

"{{description}}"

{{#globalNotes}}Additional context from global notes:\n{{globalNotes}}\n{{/globalNotes}}

Please create a structured list of todos that would help accomplish this task or project. 
You can include main tasks with subtasks where appropriate.

Return your response in the following JSON format:
\`\`\`json
{
  "todos": [
    {
      "text": "Main todo item 1",
      "children": [
        { "text": "Subtask 1.1" },
        { "text": "Subtask 1.2" }
      ]
    },
    {
      "text": "Main todo item 2"
    },
    {
      "text": "Main todo item 3",
      "children": [
        { "text": "Subtask 3.1" }
      ]
    }
  ]
}
\`\`\`
`,
    description: 'Default template for generating todo items from a description'
  }
];

const defaultConfig: LlmConfig = {
  apiKey: '',
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  useLocalLlm: false,
  localServer: '127.0.0.1',
  localPort: '1337',
  localApiPath: '/v1/chat/completions',
  promptTemplates: defaultPromptTemplates,
  activeTemplateIds: {
    cleanup: 'default-cleanup',
    suggest: 'default-suggest',
    explain: 'default-explain',
    generate: 'default-generate'
  }
};

const LlmContext = createContext<LlmContextType | undefined>(undefined);

export const useLlmContext = () => {
  const context = useContext(LlmContext);
  if (!context) {
    throw new Error('useLlmContext must be used within a LlmProvider');
  }
  return context;
};

export const LlmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<LlmConfig>(defaultConfig);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);

  // Calculate the effective endpoint based on local or remote configuration
  const getEffectiveEndpoint = (cfg: LlmConfig): string => {
    if (cfg.useLocalLlm) {
      return `http://${cfg.localServer}:${cfg.localPort}${cfg.localApiPath}`;
    }
    return cfg.apiEndpoint;
  };

  const effectiveEndpoint = getEffectiveEndpoint(config);

  // Load config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('llm-config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        
        // Ensure we have the default templates if they're missing
        if (!parsedConfig.promptTemplates) {
          parsedConfig.promptTemplates = defaultPromptTemplates;
        }
        
        // Ensure we have the active template IDs if they're missing
        if (!parsedConfig.activeTemplateIds) {
          parsedConfig.activeTemplateIds = defaultConfig.activeTemplateIds;
        }
        
        setConfig(parsedConfig);
        setIsConfigured(!!parsedConfig.apiKey || parsedConfig.useLocalLlm);
      } catch (error) {
        console.error('Failed to parse saved LLM config:', error);
      }
    }
  }, []);

  // Update config and save to localStorage
  const updateConfig = (newConfig: Partial<LlmConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    localStorage.setItem('llm-config', JSON.stringify(updatedConfig));
    setIsConfigured(!!updatedConfig.apiKey || updatedConfig.useLocalLlm);
  };
  
  // Get a prompt template by type
  const getPromptTemplate = (type: keyof LlmConfig['activeTemplateIds']): PromptTemplate | undefined => {
    const templateId = config.activeTemplateIds[type];
    return config.promptTemplates.find(template => template.id === templateId);
  };
  
  // Add a new prompt template
  const addPromptTemplate = (template: Omit<PromptTemplate, 'id'>) => {
    const newTemplate: PromptTemplate = {
      ...template,
      id: `template-${Date.now()}`
    };
    
    const updatedTemplates = [...config.promptTemplates, newTemplate];
    updateConfig({ promptTemplates: updatedTemplates });
  };
  
  // Update an existing prompt template
  const updatePromptTemplate = (template: PromptTemplate) => {
    const updatedTemplates = config.promptTemplates.map(t => 
      t.id === template.id ? template : t
    );
    updateConfig({ promptTemplates: updatedTemplates });
  };
  
  // Delete a prompt template
  const deletePromptTemplate = (id: string) => {
    // Don't allow deleting default templates
    if (id.startsWith('default-')) {
      return;
    }
    
    const updatedTemplates = config.promptTemplates.filter(t => t.id !== id);
    
    // If the deleted template was active, revert to the default
    const updatedActiveTemplateIds = { ...config.activeTemplateIds };
    Object.entries(updatedActiveTemplateIds).forEach(([key, value]) => {
      if (value === id) {
        updatedActiveTemplateIds[key as keyof LlmConfig['activeTemplateIds']] = `default-${key}`;
      }
    });
    
    updateConfig({ 
      promptTemplates: updatedTemplates,
      activeTemplateIds: updatedActiveTemplateIds
    });
  };
  
  // Set the active template for a specific type
  const setActiveTemplate = (type: keyof LlmConfig['activeTemplateIds'], templateId: string) => {
    const updatedActiveTemplateIds = {
      ...config.activeTemplateIds,
      [type]: templateId
    };
    updateConfig({ activeTemplateIds: updatedActiveTemplateIds });
  };

  return (
    <LlmContext.Provider value={{ 
      config, 
      updateConfig, 
      isConfigured, 
      effectiveEndpoint,
      getPromptTemplate,
      addPromptTemplate,
      updatePromptTemplate,
      deletePromptTemplate,
      setActiveTemplate
    }}>
      {children}
    </LlmContext.Provider>
  );
};