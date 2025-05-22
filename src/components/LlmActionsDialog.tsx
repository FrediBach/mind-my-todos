import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLlmContext } from '@/contexts/LlmContext';
import { useTodoContextSafe } from '@/hooks/useContextSafe';
import { TodoItem } from '@/contexts/TodoContext';
import { 
  cleanupTodo, 
  suggestTodos, 
  explainTodo,
  CleanupTodoResponse, 
  SuggestTodosResponse,
  ExplainTodoResponse 
} from '@/util/llmService';
import { Loader2, Check, AlertCircle, FileText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LlmConfigDialog } from './LlmConfigDialog';
import { PromptTemplateDialog } from './PromptTemplateDialog';

interface LlmActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todoId?: string; // If provided, we're working on a single todo
}

export const LlmActionsDialog: React.FC<LlmActionsDialogProps> = ({ 
  open, 
  onOpenChange,
  todoId
}) => {
  const { config, isConfigured } = useLlmContext();
  const { todos, globalNotes, editTodo, addTodo } = useTodoContextSafe();
  
  const [activeTab, setActiveTab] = useState<string>('cleanup');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cleanupResult, setCleanupResult] = useState<CleanupTodoResponse | null>(null);
  const [suggestionsResult, setSuggestionsResult] = useState<SuggestTodosResponse | null>(null);
  const [explainResult, setExplainResult] = useState<ExplainTodoResponse | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState<boolean>(false);
  const [promptTemplateDialogOpen, setPromptTemplateDialogOpen] = useState<boolean>(false);
  
  // Find the current todo if todoId is provided
  const currentTodo = todoId ? todos.find(todo => todo.id === todoId) || findTodoInChildren(todos, todoId) : null;
  
  // Get a list of context todos (siblings or the whole list if no todoId)
  const contextTodos = todoId && currentTodo 
    ? currentTodo.parentId 
      ? todos.flatMap(todo => todo.children).filter(todo => todo.parentId === currentTodo.parentId)
      : todos.filter(todo => todo.id !== todoId)
    : todos;
  
  const handleCleanup = async () => {
    if (!isConfigured) {
      setConfigDialogOpen(true);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setCleanupResult(null);
    
    try {
      if (currentTodo) {
        // Get the active template for cleanup
        const template = config.promptTemplates.find(t => t.id === config.activeTemplateIds.cleanup);
        
        // Clean up a single todo
        const result = await cleanupTodo(currentTodo, globalNotes, contextTodos, config, template);
        
        if (result.success && result.data) {
          setCleanupResult(result.data);
        } else {
          setError(result.error || 'Failed to get a response from the LLM');
        }
      } else {
        setError('No todo selected for cleanup');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSuggest = async () => {
    if (!isConfigured) {
      setConfigDialogOpen(true);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuggestionsResult(null);
    
    try {
      // Get the active template for suggestions
      const template = config.promptTemplates.find(t => t.id === config.activeTemplateIds.suggest);
      
      // Get suggestions based on all todos
      const result = await suggestTodos(todos, globalNotes, config, template);
      
      if (result.success && result.data) {
        setSuggestionsResult(result.data);
      } else {
        setError(result.error || 'Failed to get suggestions from the LLM');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleApplyCleanup = () => {
    if (currentTodo && cleanupResult) {
      editTodo(currentTodo.id, cleanupResult.text);
      onOpenChange(false);
    }
  };
  
  const handleAddSuggestion = (text: string) => {
    // Add the suggestion as a new todo
    // If we have a current todo, add it as a child, otherwise add to root
    addTodo(text, currentTodo ? currentTodo.id : null);
  };
  
  const handleAddAllSuggestions = () => {
    if (suggestionsResult && suggestionsResult.todos) {
      suggestionsResult.todos.forEach(suggestion => {
        handleAddSuggestion(suggestion.text);
      });
      onOpenChange(false);
    }
  };
  
  const handleExplain = async () => {
    if (!isConfigured) {
      setConfigDialogOpen(true);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setExplainResult(null);
    
    try {
      if (currentTodo) {
        // Get the active template for explanation
        const template = config.promptTemplates.find(t => t.id === config.activeTemplateIds.explain);
        
        // Explain the current todo in relation to global notes and other todos
        const result = await explainTodo(currentTodo, globalNotes, todos, config, template);
        
        if (result.success && result.data) {
          setExplainResult(result.data);
        } else {
          setError(result.error || 'Failed to get an explanation from the LLM');
        }
      } else {
        setError('No todo selected for explanation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setError(null);
    setCleanupResult(null);
    setSuggestionsResult(null);
    setExplainResult(null);
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>LLM Assistant</DialogTitle>
          </DialogHeader>
          
          {!isConfigured && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>API Not Configured</AlertTitle>
              <AlertDescription>
                You need to configure your LLM API settings before using this feature.
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2"
                  onClick={() => setConfigDialogOpen(true)}
                >
                  Configure API
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cleanup">Cleanup Todo</TabsTrigger>
              <TabsTrigger value="explain">Explain Todo</TabsTrigger>
              <TabsTrigger value="suggest">Suggest Todos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="cleanup" className="space-y-4 mt-4">
              {currentTodo ? (
                <div className="space-y-4">
                  <div className="border rounded-md p-3 bg-muted/30">
                    <p className="text-sm font-medium mb-1">Current Todo:</p>
                    <p>{currentTodo.text}</p>
                  </div>
                  
                  {cleanupResult && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Improved Todo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>{cleanupResult.text}</p>
                        {cleanupResult.explanation && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {cleanupResult.explanation}
                          </p>
                        )}
                      </CardContent>
                      <CardFooter>
                        <Button onClick={handleApplyCleanup}>
                          <Check className="mr-2 h-4 w-4" />
                          Apply Changes
                        </Button>
                      </CardFooter>
                    </Card>
                  )}
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {!cleanupResult && !error && (
                    <Button 
                      onClick={handleCleanup} 
                      disabled={isLoading || !isConfigured}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Improve This Todo'
                      )}
                    </Button>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    Select a todo first to use the cleanup feature.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            <TabsContent value="explain" className="space-y-4 mt-4">
              {currentTodo ? (
                <div className="space-y-4">
                  <div className="border rounded-md p-3 bg-muted/30">
                    <p className="text-sm font-medium mb-1">Current Todo:</p>
                    <p>{currentTodo.text}</p>
                  </div>
                  
                  {explainResult && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Explanation</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="whitespace-pre-line">{explainResult.explanation}</p>
                        </div>
                        
                        {explainResult.relevance && (
                          <div className="space-y-3 pt-2">
                            {explainResult.relevance.globalNotes && (
                              <div>
                                <h4 className="text-sm font-medium mb-1">Relation to Global Notes:</h4>
                                <p className="text-sm text-muted-foreground">{explainResult.relevance.globalNotes}</p>
                              </div>
                            )}
                            
                            {explainResult.relevance.relatedTodos && explainResult.relevance.relatedTodos.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium mb-1">Related Todos:</h4>
                                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                                  {explainResult.relevance.relatedTodos.map((todo, index) => (
                                    <li key={index}>{todo}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {!explainResult && !error && (
                    <Button 
                      onClick={handleExplain} 
                      disabled={isLoading || !isConfigured}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Explanation...
                        </>
                      ) : (
                        'Explain This Todo'
                      )}
                    </Button>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    Select a todo first to use the explain feature.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            <TabsContent value="suggest" className="space-y-4 mt-4">
              {suggestionsResult ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Here are some suggested todos based on your current list:
                  </p>
                  
                  {suggestionsResult.todos.map((suggestion, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{suggestion.text}</CardTitle>
                      </CardHeader>
                      {suggestion.explanation && (
                        <CardContent className="py-2">
                          <CardDescription>{suggestion.explanation}</CardDescription>
                        </CardContent>
                      )}
                      <CardFooter className="pt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAddSuggestion(suggestion.text)}
                        >
                          Add This Todo
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                  
                  <Button onClick={handleAddAllSuggestions} className="w-full">
                    Add All Suggestions
                  </Button>
                </div>
              ) : (
                <>
                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button 
                    onClick={handleSuggest} 
                    disabled={isLoading || !isConfigured}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Suggestions...
                      </>
                    ) : (
                      'Get Todo Suggestions'
                    )}
                  </Button>
                </>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <div className="flex justify-between w-full">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setConfigDialogOpen(true)}
                >
                  API Settings
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPromptTemplateDialogOpen(true)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Prompt Templates
                </Button>
              </div>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <LlmConfigDialog 
        open={configDialogOpen} 
        onOpenChange={setConfigDialogOpen} 
      />
      
      <PromptTemplateDialog
        open={promptTemplateDialogOpen}
        onOpenChange={setPromptTemplateDialogOpen}
      />
    </>
  );
};

// Helper function to find a todo in nested children
function findTodoInChildren(todos: TodoItem[], id: string): TodoItem | null {
  for (const todo of todos) {
    if (todo.id === id) {
      return todo;
    }
    
    if (todo.children.length > 0) {
      const found = findTodoInChildren(todo.children, id);
      if (found) {
        return found;
      }
    }
  }
  
  return null;
}