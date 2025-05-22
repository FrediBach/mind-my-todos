import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useLlmContext, PromptTemplate } from '@/contexts/LlmContext';
import { AlertCircle, Plus, Trash2, Edit, Save, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PromptTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PromptTemplateDialog: React.FC<PromptTemplateDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const { 
    config, 
    getPromptTemplate, 
    addPromptTemplate, 
    updatePromptTemplate, 
    deletePromptTemplate,
    setActiveTemplate
  } = useLlmContext();
  
  const [activeTab, setActiveTab] = useState<string>("cleanup");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  
  // Form state
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [userPrompt, setUserPrompt] = useState<string>("");
  
  // Get templates for the current tab
  const getTemplatesForCurrentTab = () => {
    return config.promptTemplates.filter(template => 
      template.id === config.activeTemplateIds[activeTab as keyof typeof config.activeTemplateIds] ||
      template.id.includes(activeTab) ||
      template.name.toLowerCase().includes(activeTab.toLowerCase())
    );
  };
  
  // Initialize the selected template when the tab changes
  useEffect(() => {
    const activeTemplateId = config.activeTemplateIds[activeTab as keyof typeof config.activeTemplateIds];
    setSelectedTemplateId(activeTemplateId);
    
    // Reset editing state
    setIsEditing(false);
    setIsCreating(false);
    
    // Load the active template
    const template = getPromptTemplate(activeTab as keyof typeof config.activeTemplateIds);
    if (template) {
      setName(template.name);
      setDescription(template.description || "");
      setSystemPrompt(template.systemPrompt);
      setUserPrompt(template.userPrompt);
    }
  }, [activeTab, config.activeTemplateIds]);
  
  // Load template data when selected template changes
  useEffect(() => {
    if (selectedTemplateId) {
      const template = config.promptTemplates.find(t => t.id === selectedTemplateId);
      if (template) {
        setName(template.name);
        setDescription(template.description || "");
        setSystemPrompt(template.systemPrompt);
        setUserPrompt(template.userPrompt);
      }
    }
  }, [selectedTemplateId, config.promptTemplates]);
  
  const handleCreateNew = () => {
    setIsCreating(true);
    setIsEditing(true);
    setSelectedTemplateId("");
    
    // Set default values for a new template
    setName(`New ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Template`);
    setDescription("");
    
    // Use the default template as a starting point
    const defaultTemplate = config.promptTemplates.find(t => t.id === `default-${activeTab}`);
    if (defaultTemplate) {
      setSystemPrompt(defaultTemplate.systemPrompt);
      setUserPrompt(defaultTemplate.userPrompt);
    } else {
      setSystemPrompt("You are a helpful assistant.");
      setUserPrompt("");
    }
  };
  
  const handleEdit = () => {
    setIsEditing(true);
    setIsCreating(false);
  };
  
  const handleSave = () => {
    if (isCreating) {
      // Create a new template
      addPromptTemplate({
        name,
        description,
        systemPrompt,
        userPrompt
      });
    } else if (isEditing && selectedTemplateId) {
      // Update existing template
      updatePromptTemplate({
        id: selectedTemplateId,
        name,
        description,
        systemPrompt,
        userPrompt
      });
    }
    
    setIsEditing(false);
    setIsCreating(false);
  };
  
  const handleDelete = () => {
    if (selectedTemplateId && !selectedTemplateId.startsWith('default-')) {
      deletePromptTemplate(selectedTemplateId);
      
      // Select the default template for this type
      const defaultTemplateId = `default-${activeTab}`;
      setSelectedTemplateId(defaultTemplateId);
    }
  };
  
  const handleSetActive = () => {
    if (selectedTemplateId) {
      setActiveTemplate(activeTab as keyof typeof config.activeTemplateIds, selectedTemplateId);
    }
  };
  
  const isDefaultTemplate = selectedTemplateId.startsWith('default-');
  const isActiveTemplate = selectedTemplateId === config.activeTemplateIds[activeTab as keyof typeof config.activeTemplateIds];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Prompt Templates</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col flex-grow overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="cleanup">Cleanup</TabsTrigger>
              <TabsTrigger value="suggest">Suggest</TabsTrigger>
              <TabsTrigger value="explain">Explain</TabsTrigger>
              <TabsTrigger value="generate">Generate</TabsTrigger>
            </TabsList>
            
            <div className="flex mt-4 h-[calc(70vh-100px)]">
              {/* Template List */}
              <div className="w-1/3 pr-4 border-r">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium">Templates</h3>
                  <Button variant="ghost" size="icon" onClick={handleCreateNew}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <ScrollArea className="h-[calc(70vh-140px)]">
                  {getTemplatesForCurrentTab().map((template) => (
                    <Card 
                      key={template.id} 
                      className={`mb-2 cursor-pointer ${selectedTemplateId === template.id ? 'border-primary' : ''}`}
                      onClick={() => {
                        setSelectedTemplateId(template.id);
                        setIsEditing(false);
                        setIsCreating(false);
                      }}
                    >
                      <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-sm flex items-center">
                          {template.name}
                          {template.id === config.activeTemplateIds[activeTab as keyof typeof config.activeTemplateIds] && (
                            <span className="ml-2 text-xs bg-primary/20 text-primary px-1 py-0.5 rounded">Active</span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      {template.description && (
                        <CardContent className="p-3 pt-0">
                          <CardDescription className="text-xs line-clamp-2">{template.description}</CardDescription>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </ScrollArea>
              </div>
              
              {/* Template Editor */}
              <div className="w-2/3 pl-4">
                {selectedTemplateId || isCreating ? (
                  <div className="h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-medium">
                        {isCreating ? "Create New Template" : isEditing ? "Edit Template" : "Template Details"}
                      </h3>
                      <div className="flex gap-2">
                        {!isEditing && !isCreating && (
                          <>
                            {!isDefaultTemplate && (
                              <Button variant="outline" size="icon" onClick={handleDelete}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="outline" size="icon" onClick={handleEdit} disabled={isDefaultTemplate}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!isActiveTemplate && (
                              <Button variant="outline" size="sm" onClick={handleSetActive}>
                                Set as Active
                              </Button>
                            )}
                          </>
                        )}
                        {(isEditing || isCreating) && (
                          <Button variant="outline" size="icon" onClick={handleSave}>
                            <Save className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <ScrollArea className="flex-grow">
                      <div className="space-y-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">
                            Name
                          </Label>
                          <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                            disabled={!isEditing && !isCreating}
                          />
                        </div>
                        
                        <div className="grid grid-cols-4 items-start gap-4">
                          <Label htmlFor="description" className="text-right pt-2">
                            Description
                          </Label>
                          <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="col-span-3 min-h-[60px]"
                            disabled={!isEditing && !isCreating}
                          />
                        </div>
                        
                        <div className="grid grid-cols-4 items-start gap-4">
                          <Label htmlFor="systemPrompt" className="text-right pt-2">
                            System Prompt
                          </Label>
                          <Textarea
                            id="systemPrompt"
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            className="col-span-3 min-h-[80px]"
                            disabled={!isEditing && !isCreating}
                          />
                        </div>
                        
                        <div className="grid grid-cols-4 items-start gap-4">
                          <Label htmlFor="userPrompt" className="text-right pt-2">
                            User Prompt
                          </Label>
                          <div className="col-span-3 space-y-2">
                            <Textarea
                              id="userPrompt"
                              value={userPrompt}
                              onChange={(e) => setUserPrompt(e.target.value)}
                              className="min-h-[200px] font-mono text-sm"
                              disabled={!isEditing && !isCreating}
                            />
                            
                            {(isEditing || isCreating) && (
                              <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                  <p className="font-medium mb-1">Template Variables:</p>
                                  <ul className="list-disc pl-5 space-y-1">
                                    <li><code>{'{{todoText}}'}</code> - The text of the current todo</li>
                                    <li><code>{'{{globalNotes}}'}</code> - Global notes content</li>
                                    <li><code>{'{{todosText}}'}</code> - All todos formatted as a list</li>
                                    <li><code>{'{{description}}'}</code> - Description for generating todos</li>
                                    <li><code>{'{{#condition}}...{{/condition}}'}</code> - Conditional block that only appears if the condition is true</li>
                                  </ul>
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-muted-foreground mb-4">Select a template or create a new one</p>
                      <Button variant="outline" onClick={handleCreateNew}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Template
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Tabs>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};