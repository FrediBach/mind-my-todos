import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLlmContext } from '@/contexts/LlmContext';
import { AlertCircle, Info, Server, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PromptTemplateDialog } from './PromptTemplateDialog';

interface LlmConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LlmConfigDialog: React.FC<LlmConfigDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const { config, updateConfig, isConfigured, effectiveEndpoint } = useLlmContext();
  
  const [activeTab, setActiveTab] = useState<string>("remote");
  const [useLocalLlm, setUseLocalLlm] = useState(config.useLocalLlm);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [apiEndpoint, setApiEndpoint] = useState(config.apiEndpoint);
  const [model, setModel] = useState(config.model);
  const [temperature, setTemperature] = useState(config.temperature);
  const [localServer, setLocalServer] = useState(config.localServer);
  const [localPort, setLocalPort] = useState(config.localPort);
  const [localApiPath, setLocalApiPath] = useState(config.localApiPath);
  const [promptTemplateDialogOpen, setPromptTemplateDialogOpen] = useState(false);
  
  // Set the active tab based on the current configuration
  useEffect(() => {
    setActiveTab(config.useLocalLlm ? "local" : "remote");
  }, [config.useLocalLlm]);
  
  // Update useLocalLlm when tab changes
  useEffect(() => {
    setUseLocalLlm(activeTab === "local");
  }, [activeTab]);
  
  const handleSave = () => {
    updateConfig({
      apiKey,
      apiEndpoint,
      model,
      temperature,
      useLocalLlm,
      localServer,
      localPort,
      localApiPath
    });
    onOpenChange(false);
  };
  
  const handleReset = () => {
    if (activeTab === "remote") {
      setApiEndpoint('https://api.openai.com/v1/chat/completions');
      setModel('gpt-3.5-turbo');
      setTemperature(0.7);
    } else {
      setLocalServer('127.0.0.1');
      setLocalPort('1337');
      setLocalApiPath('/v1/chat/completions');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>LLM API Configuration</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                All configuration is stored locally in your browser and is never sent to our servers.
              </AlertDescription>
            </Alert>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="remote">Remote LLM</TabsTrigger>
                <TabsTrigger value="local">Local LLM</TabsTrigger>
              </TabsList>
              
              <TabsContent value="remote" className="mt-4 space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="apiKey" className="text-right">
                    API Key
                  </Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="apiEndpoint" className="text-right">
                    API Endpoint
                  </Label>
                  <Input
                    id="apiEndpoint"
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    placeholder="https://api.openai.com/v1/chat/completions"
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="model" className="text-right">
                    Model
                  </Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger id="model" className="col-span-3">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                      <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                      <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              
              <TabsContent value="local" className="mt-4 space-y-4">
                <Alert className="mb-4">
                  <Server className="h-4 w-4" />
                  <AlertDescription>
                    Configure connection to a local LLM server like Jan or similar applications.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="localServer" className="text-right">
                    Server
                  </Label>
                  <Input
                    id="localServer"
                    value={localServer}
                    onChange={(e) => setLocalServer(e.target.value)}
                    placeholder="127.0.0.1"
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="localPort" className="text-right">
                    Port
                  </Label>
                  <Input
                    id="localPort"
                    value={localPort}
                    onChange={(e) => setLocalPort(e.target.value)}
                    placeholder="1337"
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="localApiPath" className="text-right">
                    API Path
                  </Label>
                  <Input
                    id="localApiPath"
                    value={localApiPath}
                    onChange={(e) => setLocalApiPath(e.target.value)}
                    placeholder="/v1/chat/completions"
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="model" className="text-right">
                    Model
                  </Label>
                  <Input
                    id="model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Local model name"
                    className="col-span-3"
                  />
                </div>
              </TabsContent>
              
              <div className="grid grid-cols-4 items-center gap-4 mt-4">
                <Label htmlFor="temperature" className="text-right">
                  Temperature: {temperature.toFixed(1)}
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <span className="text-xs">0.0</span>
                  <Slider
                    id="temperature"
                    min={0}
                    max={2}
                    step={0.1}
                    value={[temperature]}
                    onValueChange={(value) => setTemperature(value[0])}
                  />
                  <span className="text-xs">2.0</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Info size={14} />
                <span>
                  Lower temperature (0.0-0.5) for more predictable outputs, higher (0.7-2.0) for more creative responses.
                </span>
              </div>
              
              <div className="mt-4 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Current endpoint:</p>
                    <p className="text-xs text-muted-foreground break-all">{effectiveEndpoint}</p>
                  </div>
                </div>
              </div>
            </Tabs>
          </div>
          
          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>
                Reset to Defaults
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setPromptTemplateDialogOpen(true)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Prompt Templates
              </Button>
            </div>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <PromptTemplateDialog
        open={promptTemplateDialogOpen}
        onOpenChange={setPromptTemplateDialogOpen}
      />
    </>
  );
};