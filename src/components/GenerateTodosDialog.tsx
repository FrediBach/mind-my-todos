import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLlmContext } from '@/contexts/LlmContext';
import { useTodoContextSafe } from '@/hooks/useContextSafe';
import { generateTodosFromDescription, GenerateTodosResponse } from '@/util/llmService';
import { Loader2, Check, AlertCircle, Sparkles, FileText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LlmConfigDialog } from './LlmConfigDialog';
import { PromptTemplateDialog } from './PromptTemplateDialog';

interface GenerateTodosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId?: string | null;
}

export const GenerateTodosDialog: React.FC<GenerateTodosDialogProps> = ({ 
  open, 
  onOpenChange,
  parentId = null
}) => {
  const { config, isConfigured } = useLlmContext();
  const { addTodo, globalNotes } = useTodoContextSafe();
  
  const [description, setDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedTodos, setGeneratedTodos] = useState<GenerateTodosResponse | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState<boolean>(false);
  const [promptTemplateDialogOpen, setPromptTemplateDialogOpen] = useState<boolean>(false);
  
  const handleGenerate = async () => {
    if (!isConfigured) {
      setConfigDialogOpen(true);
      return;
    }
    
    if (!description.trim()) {
      setError('Please enter a description of the task or project.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setGeneratedTodos(null);
    
    try {
      // Get the active template for generation
      const template = config.promptTemplates.find(t => t.id === config.activeTemplateIds.generate);
      
      const result = await generateTodosFromDescription(description, globalNotes, config, template);
      
      if (result.success && result.data) {
        setGeneratedTodos(result.data);
      } else {
        setError(result.error || 'Failed to generate todos from the description');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddGeneratedTodos = () => {
    if (!generatedTodos || !generatedTodos.todos) return;
    
    // Add each generated todo
    generatedTodos.todos.forEach(todo => {
      // Add the main todo
      const mainTodoId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      addTodo(todo.text, parentId);
      
      // If there are children, add them with a slight delay to ensure proper ordering
      if (todo.children && todo.children.length > 0) {
        // We need to find the ID of the newly created todo to add children to it
        // For now, we'll use a timeout to allow the main todo to be created first
        setTimeout(() => {
          todo.children?.forEach(child => {
            addTodo(child.text, mainTodoId);
          });
        }, 100);
      }
    });
    
    // Close the dialog
    onOpenChange(false);
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate Todos with AI
            </DialogTitle>
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
          
          <div className="space-y-4">
            {!generatedTodos ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="description">Describe your task or project</Label>
                  <Textarea
                    id="description"
                    placeholder="E.g., Plan a team offsite event for 10 people"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-sm text-muted-foreground">
                    Provide a brief description of what you want to accomplish, and the AI will generate a list of todos for you.
                  </p>
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  onClick={handleGenerate} 
                  disabled={isLoading || !description.trim() || !isConfigured}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Todos...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Todos
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Alert className="mb-4">
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    Successfully generated {generatedTodos.todos.length} todo items.
                  </AlertDescription>
                </Alert>
                
                <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1">
                  {generatedTodos.todos.map((todo, index) => (
                    <Card key={index} className="border">
                      <CardHeader className="py-3">
                        <CardTitle className="text-base">{todo.text}</CardTitle>
                      </CardHeader>
                      {todo.children && todo.children.length > 0 && (
                        <CardContent className="py-2">
                          <ul className="list-disc pl-5 space-y-1">
                            {todo.children.map((child, childIndex) => (
                              <li key={childIndex} className="text-sm">
                                {child.text}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
                
                <Button 
                  onClick={handleAddGeneratedTodos} 
                  className="w-full"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Add All Todos
                </Button>
              </>
            )}
          </div>
          
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
                Cancel
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