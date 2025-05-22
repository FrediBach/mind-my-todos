import { useTextSize } from "./TextSizeProvider";
import { 
  ToggleGroup, 
  ToggleGroupItem 
} from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function TextSizeToggle() {
  const { textSize, setTextSize } = useTextSize();

  return (
    <TooltipProvider>
      <ToggleGroup 
        type="single" 
        value={textSize} 
        className="gap-0" 
        onValueChange={(value) => {
          if (value) setTextSize(value as "small" | "medium" | "large");
        }}>
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="small" aria-label="Small text size">
              <span className="font-semibold text-xs">T</span>
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>Small text</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="medium" aria-label="Medium text size">
              <span className="font-semibold text-sm">T</span>
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>Medium text</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="large" aria-label="Large text size">
              <span className="font-semibold text-base">T</span>
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>Large text</p>
          </TooltipContent>
        </Tooltip>
      </ToggleGroup>
    </TooltipProvider>
  );
}