import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  ChevronRight, 
  CheckSquare, 
  Undo, 
  Redo, 
  Bookmark,
  ArrowDownAZ,
  ArrowUpZA,
  Sparkles,
  DollarSign,
  Star,
  Clock,
  SortAsc
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import GlobalNotesDialog from '@/components/GlobalNotesDialog';
import { LlmActionsButton } from '@/components/LlmActionsButton';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

interface TodoActionsProps {
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  onCollapseCompleted?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onNavigateBookmark?: () => void;
  onSortAscending?: () => void;
  onSortDescending?: () => void;
  onSortByCostAscending?: () => void;
  onSortByCostDescending?: () => void;
  onSortByStoryPointsAscending?: () => void;
  onSortByStoryPointsDescending?: () => void;
  onSortByTimeEstimateAscending?: () => void;
  onSortByTimeEstimateDescending?: () => void;
  globalNotes?: string;
  onGlobalNotesChange?: (notes: string) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  hasBookmark?: boolean;
  className?: string;
}

/**
 * Common todo action buttons used in the toolbar
 */
export const TodoActions: React.FC<TodoActionsProps> = ({
  onExpandAll,
  onCollapseAll,
  onCollapseCompleted,
  onUndo,
  onRedo,
  onNavigateBookmark,
  onSortAscending,
  onSortDescending,
  onSortByCostAscending,
  onSortByCostDescending,
  onSortByStoryPointsAscending,
  onSortByStoryPointsDescending,
  onSortByTimeEstimateAscending,
  onSortByTimeEstimateDescending,
  globalNotes = '',
  onGlobalNotesChange,
  canUndo = false,
  canRedo = false,
  hasBookmark = false,
  className
}) => {
  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Group 1: View Controls */}
        <div className="flex items-center gap-2">
          {onExpandAll && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={onExpandAll}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Expand all</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {onCollapseAll && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={onCollapseAll}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Collapse all</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {onCollapseCompleted && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={onCollapseCompleted}
                >
                  <CheckSquare className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Collapse completed todos</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        
        {/* Separator between view controls and navigation */}
        {onNavigateBookmark && (
          <Separator orientation="vertical" className="h-8" />
        )}
        
        {/* Group 2: Navigation */}
        {onNavigateBookmark && (
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={onNavigateBookmark}
                  disabled={!hasBookmark}
                >
                  <Bookmark className={hasBookmark ? "fill-primary" : ""} size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Go to bookmark</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
        
        {/* Separator between navigation and history controls */}
        {(onNavigateBookmark && (onUndo || onRedo)) && (
          <Separator orientation="vertical" className="h-8" />
        )}
        
        {/* Group 3: History Controls */}
        {(onUndo || onRedo) && (
          <div className="flex items-center gap-2">
            {onUndo && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={onUndo}
                    disabled={!canUndo}
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Undo (Ctrl+Z)</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {onRedo && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={onRedo}
                    disabled={!canRedo}
                  >
                    <Redo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Redo (Ctrl+Y)</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
        
        {/* Separator between history controls and sorting */}
        {((onUndo || onRedo) && (onSortAscending || onSortDescending)) && (
          <Separator orientation="vertical" className="h-8" />
        )}
        
        {/* Group 4: Sorting Controls */}
        {(onSortAscending || onSortDescending || 
          onSortByCostAscending || onSortByCostDescending || 
          onSortByStoryPointsAscending || onSortByStoryPointsDescending || 
          onSortByTimeEstimateAscending || onSortByTimeEstimateDescending) && (
          <div className="flex items-center gap-2">
            {/* Consolidated sorting dropdown */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <SortAsc className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sort todos</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort Todos By</DropdownMenuLabel>
                
                {/* Text sorting options */}
                {(onSortAscending || onSortDescending) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="flex items-center">
                      <ArrowDownAZ className="h-4 w-4 mr-2" />
                      Alphabetical
                    </DropdownMenuLabel>
                    {onSortAscending && (
                      <DropdownMenuItem onClick={onSortAscending}>
                        <ArrowDownAZ className="h-4 w-4 mr-2" />
                        A to Z
                      </DropdownMenuItem>
                    )}
                    {onSortDescending && (
                      <DropdownMenuItem onClick={onSortDescending}>
                        <ArrowUpZA className="h-4 w-4 mr-2" />
                        Z to A
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                
                {/* Cost sorting options */}
                {(onSortByCostAscending || onSortByCostDescending) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Cost
                    </DropdownMenuLabel>
                    {onSortByCostAscending && (
                      <DropdownMenuItem onClick={onSortByCostAscending}>
                        <ArrowDownAZ className="h-4 w-4 mr-2" />
                        Low to High
                      </DropdownMenuItem>
                    )}
                    {onSortByCostDescending && (
                      <DropdownMenuItem onClick={onSortByCostDescending}>
                        <ArrowUpZA className="h-4 w-4 mr-2" />
                        High to Low
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                
                {/* Story Points sorting options */}
                {(onSortByStoryPointsAscending || onSortByStoryPointsDescending) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="flex items-center">
                      <Star className="h-4 w-4 mr-2" />
                      Story Points
                    </DropdownMenuLabel>
                    {onSortByStoryPointsAscending && (
                      <DropdownMenuItem onClick={onSortByStoryPointsAscending}>
                        <ArrowDownAZ className="h-4 w-4 mr-2" />
                        Low to High
                      </DropdownMenuItem>
                    )}
                    {onSortByStoryPointsDescending && (
                      <DropdownMenuItem onClick={onSortByStoryPointsDescending}>
                        <ArrowUpZA className="h-4 w-4 mr-2" />
                        High to Low
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                
                {/* Time Estimate sorting options */}
                {(onSortByTimeEstimateAscending || onSortByTimeEstimateDescending) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Time Estimate
                    </DropdownMenuLabel>
                    {onSortByTimeEstimateAscending && (
                      <DropdownMenuItem onClick={onSortByTimeEstimateAscending}>
                        <ArrowDownAZ className="h-4 w-4 mr-2" />
                        Short to Long
                      </DropdownMenuItem>
                    )}
                    {onSortByTimeEstimateDescending && (
                      <DropdownMenuItem onClick={onSortByTimeEstimateDescending}>
                        <ArrowUpZA className="h-4 w-4 mr-2" />
                        Long to Short
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        
        {/* Separator between sorting and notes */}
        {((onSortAscending || onSortDescending) && onGlobalNotesChange) && (
          <Separator orientation="vertical" className="h-8" />
        )}
        
        {/* Group 5: Notes */}
        {onGlobalNotesChange && (
          <div className="flex items-center gap-2">
            <GlobalNotesDialog 
              notes={globalNotes} 
              onNotesChange={onGlobalNotesChange} 
            />
          </div>
        )}
        
        {/* Separator before AI assistant */}
        <Separator orientation="vertical" className="h-8" />
        
        {/* Group 6: AI Assistant */}
        <div className="flex items-center gap-2">
          <LlmActionsButton />
        </div>
      </div>
    </TooltipProvider>
  );
};

export default TodoActions;