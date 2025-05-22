import React from 'react';

interface NestingLinesProps {
  level: number;
  isLastChild: boolean;
  hasChildren: boolean;
  isCollapsed: boolean;
}

const NestingLines: React.FC<NestingLinesProps> = ({ 
  level, 
  isLastChild, 
  hasChildren,
  isCollapsed
}) => {
  if (level === 0) return null;
  
  // Create an array of levels to render lines for
  const levels = Array.from({ length: level }, (_, i) => i);
  
  return (
    <div className="absolute left-0 top-0 bottom-0 w-full pointer-events-none">
      {/* Render vertical lines for each level */}
      {levels.map((l) => {
        const isDeepestLevel = l === level - 1;
        return (
          <div 
            key={l}
            className="absolute top-0 bottom-0 w-[1px] bg-border/40 nesting-line"
            style={{ 
              left: `${(l * 24) + 12}px`,
              // If this is the last child at the deepest level, don't extend the line all the way down
              height: isDeepestLevel && isLastChild ? '14px' : '100%',
              // Make the deepest level line slightly more visible
              opacity: isDeepestLevel ? 0.8 : 0.4
            }}
          />
        );
      })}
      
      {/* Horizontal connector line */}
      <div 
        className="absolute h-[1px] bg-border/40 nesting-line"
        style={{ 
          left: `${((level - 1) * 24) + 12}px`,
          width: '12px',
          top: '14px'
        }}
      />
    </div>
  );
};

export default NestingLines;