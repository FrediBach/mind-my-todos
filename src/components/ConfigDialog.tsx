import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConfigContext } from '@/contexts/ConfigContext';
import { useLlmContext } from '@/contexts/LlmContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';

interface ConfigDialogProps {
  trigger?: React.ReactNode;
}

export const ConfigDialog: React.FC<ConfigDialogProps> = ({ 
  trigger = (
    <Button variant="ghost" size="icon" className="h-7 w-7">
      <Settings size={16} />
    </Button>
  )
}) => {
  const { config, updateCurrencySettings, updateDueDateSettings, updateThemeSettings, updateTimeTrackingSettings } = useConfigContext();
  const { config: llmConfig, updateConfig: updateLlmConfig, isConfigured } = useLlmContext();
  const { toast } = useToast();
  
  // Local state for form values
  const [currencySymbol, setCurrencySymbol] = useState(config.currency.symbol);
  const [currencyCode, setCurrencyCode] = useState(config.currency.code);
  const [currencyPosition, setCurrencyPosition] = useState(config.currency.position);
  
  const [alertDays, setAlertDays] = useState(config.dueDate.alertDays.toString());
  const [showDueTodayAlert, setShowDueTodayAlert] = useState(config.dueDate.showDueTodayAlert);
  
  const [preferredMode, setPreferredMode] = useState(config.theme.preferredMode);
  
  const [autoStartTimer, setAutoStartTimer] = useState(config.timeTracking.autoStartTimer);
  const [showElapsedTimeInTitle, setShowElapsedTimeInTitle] = useState(config.timeTracking.showElapsedTimeInTitle);
  
  const [apiKey, setApiKey] = useState(llmConfig.apiKey);
  const [model, setModel] = useState(llmConfig.model);
  const [temperature, setTemperature] = useState(llmConfig.temperature.toString());
  const [useLocalLlm, setUseLocalLlm] = useState(llmConfig.useLocalLlm);
  const [localServer, setLocalServer] = useState(llmConfig.localServer);
  const [localPort, setLocalPort] = useState(llmConfig.localPort);
  
  // Auto-save handlers for each setting type
  const handleCurrencyChange = (field: string, value: string) => {
    if (field === 'symbol') {
      setCurrencySymbol(value);
      updateCurrencySettings({
        symbol: value,
        code: currencyCode,
        position: currencyPosition as 'before' | 'after',
      });
      toast({
        description: "Currency symbol updated",
        duration: 1500,
      });
    } else if (field === 'code') {
      setCurrencyCode(value);
      updateCurrencySettings({
        symbol: currencySymbol,
        code: value,
        position: currencyPosition as 'before' | 'after',
      });
      toast({
        description: "Currency code updated",
        duration: 1500,
      });
    } else if (field === 'position') {
      setCurrencyPosition(value as 'before' | 'after');
      updateCurrencySettings({
        symbol: currencySymbol,
        code: currencyCode,
        position: value as 'before' | 'after',
      });
      toast({
        description: "Currency position updated",
        duration: 1500,
      });
    }
  };
  
  const handleDueDateChange = (field: string, value: any) => {
    if (field === 'alertDays') {
      setAlertDays(value);
      updateDueDateSettings({
        alertDays: parseInt(value) || 3,
        showDueTodayAlert,
      });
      toast({
        description: "Alert days updated",
        duration: 1500,
      });
    } else if (field === 'showDueTodayAlert') {
      setShowDueTodayAlert(value);
      updateDueDateSettings({
        alertDays: parseInt(alertDays) || 3,
        showDueTodayAlert: value,
      });
      toast({
        description: `Due today alert ${value ? 'enabled' : 'disabled'}`,
        duration: 1500,
      });
    }
  };
  
  const handleThemeChange = (value: 'dark' | 'light' | 'system') => {
    setPreferredMode(value);
    updateThemeSettings({
      preferredMode: value,
    });
    toast({
      description: `Theme set to ${value} mode`,
      duration: 1500,
    });
  };
  
  const handleTimeTrackingChange = (field: string, value: boolean) => {
    if (field === 'autoStartTimer') {
      setAutoStartTimer(value);
      updateTimeTrackingSettings({
        autoStartTimer: value,
        showElapsedTimeInTitle,
      });
      toast({
        description: `Auto-start timer ${value ? 'enabled' : 'disabled'}`,
        duration: 1500,
      });
    } else if (field === 'showElapsedTimeInTitle') {
      setShowElapsedTimeInTitle(value);
      updateTimeTrackingSettings({
        autoStartTimer,
        showElapsedTimeInTitle: value,
      });
      toast({
        description: `Time in title ${value ? 'enabled' : 'disabled'}`,
        duration: 1500,
      });
    }
  };
  
  // Debounce LLM settings to avoid too many updates
  useEffect(() => {
    const timer = setTimeout(() => {
      updateLlmConfig({
        apiKey,
        model,
        temperature: parseFloat(temperature) || 0.7,
        useLocalLlm,
        localServer,
        localPort,
      });
      
      toast({
        description: "AI settings updated",
        duration: 1500,
      });
    }, 500);
    
    return () => clearTimeout(timer);
  }, [apiKey, model, temperature, useLocalLlm, localServer, localPort]);
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Application Settings</DialogTitle>
          <DialogDescription>
            Configure application settings and preferences
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="currency">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="currency">Currency</TabsTrigger>
            <TabsTrigger value="dueDate">Due Dates</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
            <TabsTrigger value="timeTracking">Time Tracking</TabsTrigger>
            <TabsTrigger value="llm">AI Settings</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[400px] pr-4">
            {/* Currency Settings */}
            <TabsContent value="currency">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currencySymbol">Currency Symbol</Label>
                  <Input 
                    id="currencySymbol" 
                    value={currencySymbol} 
                    onChange={(e) => handleCurrencyChange('symbol', e.target.value)}
                    placeholder="$"
                  />
                  <p className="text-sm text-muted-foreground">
                    The symbol used for displaying costs (e.g., $, €, £)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currencyCode">Currency Code</Label>
                  <Input 
                    id="currencyCode" 
                    value={currencyCode} 
                    onChange={(e) => handleCurrencyChange('code', e.target.value)}
                    placeholder="USD"
                  />
                  <p className="text-sm text-muted-foreground">
                    The three-letter currency code (e.g., USD, EUR, GBP)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currencyPosition">Symbol Position</Label>
                  <Select 
                    value={currencyPosition} 
                    onValueChange={(value) => handleCurrencyChange('position', value)}
                  >
                    <SelectTrigger id="currencyPosition">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="before">Before amount ($10.00)</SelectItem>
                      <SelectItem value="after">After amount (10.00$)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Where to display the currency symbol relative to the amount
                  </p>
                </div>
              </div>
            </TabsContent>
            
            {/* Due Date Settings */}
            <TabsContent value="dueDate">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="alertDays">Alert Days</Label>
                  <Input 
                    id="alertDays" 
                    type="number" 
                    min="0" 
                    max="30" 
                    value={alertDays} 
                    onChange={(e) => handleDueDateChange('alertDays', e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Number of days before a due date to start showing alerts
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="showDueTodayAlert" 
                    checked={showDueTodayAlert} 
                    onCheckedChange={(value) => handleDueDateChange('showDueTodayAlert', value)}
                  />
                  <Label htmlFor="showDueTodayAlert">Show Due Today Alert</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Display a prominent alert for todos due today
                </p>
              </div>
            </TabsContent>
            
            {/* Theme Settings */}
            <TabsContent value="theme">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Preferred Theme Mode</Label>
                  <RadioGroup 
                    value={preferredMode} 
                    onValueChange={(value) => handleThemeChange(value as 'dark' | 'light' | 'system')}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dark" id="dark" />
                      <Label htmlFor="dark">Dark Mode</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="light" id="light" />
                      <Label htmlFor="light">Light Mode</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="system" id="system" />
                      <Label htmlFor="system">System Preference</Label>
                    </div>
                  </RadioGroup>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred theme mode or use your system's preference
                  </p>
                </div>
              </div>
            </TabsContent>
            
            {/* Time Tracking Settings */}
            <TabsContent value="timeTracking">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="autoStartTimer" 
                    checked={autoStartTimer} 
                    onCheckedChange={(value) => handleTimeTrackingChange('autoStartTimer', value)}
                  />
                  <Label htmlFor="autoStartTimer">Auto-start Timer</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Automatically start the timer when the app loads
                </p>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="showElapsedTimeInTitle" 
                    checked={showElapsedTimeInTitle} 
                    onCheckedChange={(value) => handleTimeTrackingChange('showElapsedTimeInTitle', value)}
                  />
                  <Label htmlFor="showElapsedTimeInTitle">Show Time in Title</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Display elapsed time in the browser tab title
                </p>
              </div>
            </TabsContent>
            
            {/* LLM API Settings */}
            <TabsContent value="llm">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">OpenAI API Key</Label>
                  <Input 
                    id="apiKey" 
                    type="password" 
                    value={apiKey} 
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                  />
                  <p className="text-sm text-muted-foreground">
                    Your OpenAI API key for AI features (stored locally in your browser)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="model">AI Model</Label>
                  <Select 
                    value={model} 
                    onValueChange={setModel}
                  >
                    <SelectTrigger id="model">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    The AI model to use for generating content
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input 
                    id="temperature" 
                    type="number" 
                    min="0" 
                    max="2" 
                    step="0.1" 
                    value={temperature} 
                    onChange={(e) => setTemperature(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Controls randomness: 0 is deterministic, 1 is creative, 2 is very random
                  </p>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="useLocalLlm" 
                    checked={useLocalLlm} 
                    onCheckedChange={setUseLocalLlm}
                  />
                  <Label htmlFor="useLocalLlm">Use Local LLM Server</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use a local LLM server instead of OpenAI API
                </p>
                
                {useLocalLlm && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="localServer">Local Server Address</Label>
                      <Input 
                        id="localServer" 
                        value={localServer} 
                        onChange={(e) => setLocalServer(e.target.value)}
                        placeholder="127.0.0.1"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="localPort">Local Server Port</Label>
                      <Input 
                        id="localPort" 
                        value={localPort} 
                        onChange={(e) => setLocalPort(e.target.value)}
                        placeholder="1337"
                      />
                    </div>
                  </>
                )}
                
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <p className="text-sm">
                    {isConfigured 
                      ? "✅ AI features are configured and ready to use" 
                      : "⚠️ AI features require configuration to work"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your API key is stored only in your browser's local storage and is never sent to our servers.
                  </p>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigDialog;