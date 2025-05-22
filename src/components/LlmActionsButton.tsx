import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LlmActionsDialog } from './LlmActionsDialog';

interface LlmActionsButtonProps {
  todoId?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const LlmActionsButton: React.FC<LlmActionsButtonProps> = ({
  todoId,
  variant = 'outline',
  size = 'icon'
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  return (
    <TooltipProvider>
      <>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={variant} 
              size={size} 
              onClick={() => setDialogOpen(true)}
              id={todoId ? `llm-button-${todoId}` : 'llm-button-global'}
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>AI Assistant</p>
          </TooltipContent>
        </Tooltip>
        
        <LlmActionsDialog 
          open={dialogOpen} 
          onOpenChange={setDialogOpen} 
          todoId={todoId}
        />
      </>
    </TooltipProvider>
  );
};