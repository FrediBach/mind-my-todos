import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GenerateTodosDialog } from './GenerateTodosDialog';
import { cn } from '@/lib/utils';

interface GenerateTodosButtonProps {
  parentId?: string | null;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const GenerateTodosButton: React.FC<GenerateTodosButtonProps> = ({
  parentId = null,
  variant = 'default',
  size = 'default'
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  return (
    <TooltipProvider>
      <>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              className={cn(
                "bg-purple-600 hover:bg-purple-700 text-white",
                "transition-all duration-300",
                "hover:shadow-[0_0_8px_3px_rgba(168,85,247,0.4)]",
                "relative overflow-hidden group"
              )}
              size={size} 
              onClick={() => setDialogOpen(true)}
              id="generate-todos-button"
            >
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none">
                <span className="absolute h-8 w-8 -left-2 -top-2 bg-white/20 rounded-full blur-md animate-pulse"></span>
                <span className="absolute h-6 w-6 right-4 top-1 bg-white/20 rounded-full blur-md animate-pulse" style={{ animationDelay: "300ms" }}></span>
                <span className="absolute h-4 w-4 left-3 bottom-0 bg-white/20 rounded-full blur-md animate-pulse" style={{ animationDelay: "500ms" }}></span>
              </span>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate with AI
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Generate todos from a description using AI</p>
          </TooltipContent>
        </Tooltip>
        
        <GenerateTodosDialog 
          open={dialogOpen} 
          onOpenChange={setDialogOpen} 
          parentId={parentId}
        />
      </>
    </TooltipProvider>
  );
};