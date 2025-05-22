import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Clock, Layers } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import DraggableTodoItem from './DraggableTodoItem';
import ImportDialog from './ImportDialog';
import ExportDialog from './ExportDialog';
import ClearAllDialog from './ClearAllDialog';
import SearchBar from './SearchBar';
import { DueTodayAlert } from './DueTodayAlert';
import { useTodoContext } from '@/contexts/TodoContext';
import { useTodoLists } from '@/contexts/TodoListsContext';
import { useTimeTrackingSafe } from '@/hooks/useContextSafe';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { useDroppable } from '@dnd-kit/core';
import { ProgressWithText } from '@/components/ui/progress-with-text';
import { TimeDisplay } from '@/components/ui/time-display';
import { TodoActions } from '@/components/ui/todo-actions';
import { getTotalStats } from '@/util/todoStats';

// Component for root-level drop indicators
interface RootDropIndicatorProps {
  position: 'first' | 'last';
}

const RootDropIndicator: React.FC<RootDropIndicatorProps> = ({ position }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `root-${position}-position`,
    data: {
      type: 'root-position',
      position,
      accepts: ['todo'],
    },
  });

  return (
    <div 
      ref={setNodeRef}
      className="h-2 relative"
    >
      {isOver && (
        <div className="absolute w-full h-1 bg-primary rounded-full animate-pulse" />
      )}
    </div>
  );
};

const DraggableTodoList: React.FC = () => {
  const { 
    todos, 
    filteredTodos,
    pinnedTodos,
    searchQuery,
    addTodo, 
    moveTodo, 
    expandTodo, 
    expandAllTodos, 
    collapseAllTodos,
    collapseCompletedTodos,
    undo,
    redo,
    canUndo,
    canRedo,
    navigateToBookmark,
    bookmarkedTodoId,
    globalNotes,
    setGlobalNotes,
    sortRootTodosAscending,
    sortRootTodosDescending,
    sortRootTodosByCost,
    sortRootTodosByStoryPoints,
    sortRootTodosByTimeEstimate
  } = useTodoContext();
  
  const { lists, activeListId } = useTodoLists();
  const activeList = lists.find(list => list.id === activeListId);
  
  // Add keyboard shortcuts for undo/redo
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Ctrl/Cmd + Z is pressed for Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undo();
        }
      }
      
      // Check if Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z is pressed for Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) {
          redo();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);
  const [newTodoText, setNewTodoText] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [wrapTodosEnabled, setWrapTodosEnabled] = useState(false);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance before activation
      },
    })
  );

  const handleAddTodo = () => {
    if (newTodoText.trim()) {
      if (wrapTodosEnabled && todos.length > 0) {
        // Create a new parent todo
        const newTodoId = addTodo(newTodoText, null);
        
        // Move all existing top-level todos to be children of the new todo
        const existingTodoIds = [...todos].map(todo => todo.id);
        
        // We need to move todos one by one, starting from the last one to preserve order
        for (let i = existingTodoIds.length - 1; i >= 0; i--) {
          // Skip the newly created todo
          if (existingTodoIds[i] !== newTodoId) {
            moveTodo(existingTodoIds[i], newTodoId, 0);
          }
        }
      } else {
        // Normal behavior - just add a new todo
        addTodo(newTodoText, null);
      }
      setNewTodoText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTodo();
    }
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = active.data.current?.id;
    if (id) {
      setActiveId(id);
    }
  };

  // Handle drag over to expand collapsed todos
  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      const overId = over.data.current?.id;
      if (overId) {
        expandTodo(overId);
      }
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const activeId = active.data.current?.id;
      const overData = over.data.current;
      
      if (activeId && overData) {
        const overId = overData.id;
        const overType = overData.type;
        const position = overData.position;
        
        if (overType === 'position') {
          // Handle position-based drop (before/after)
          const parentId = overData.parentId;
          
          // Find the index of the target todo in its parent's children
          let targetIndex = 0;
          
          if (parentId === null) {
            // Root level todos
            targetIndex = todos.findIndex(t => t.id === overId);
            if (position === 'after') targetIndex += 1;
            
            // Move to root level at specific position
            moveTodo(activeId, null, targetIndex);
          } else {
            // Find the parent and the index within its children
            const findParentAndIndex = (items: typeof todos, parentId: string, targetId: string): { parent: typeof todos[0] | null, index: number } => {
              for (const item of items) {
                if (item.id === parentId) {
                  const index = item.children.findIndex(c => c.id === targetId);
                  return { parent: item, index };
                }
                
                if (item.children.length > 0) {
                  const result = findParentAndIndex(item.children, parentId, targetId);
                  if (result.parent) return result;
                }
              }
              
              return { parent: null, index: -1 };
            };
            
            const { parent, index } = findParentAndIndex(todos, parentId, overId);
            
            if (parent) {
              const newIndex = position === 'after' ? index + 1 : index;
              // Move to the same parent but at a specific position
              moveTodo(activeId, parentId, newIndex);
            }
          }
        } else if (overType === 'root-position') {
          // Handle root position indicators
          const rootPosition = overData.position;
          const targetIndex = rootPosition === 'first' ? 0 : todos.length;
          
          // Move to root level at specific position
          moveTodo(activeId, null, targetIndex);
        } else {
          // Handle regular drop (into a todo)
          moveTodo(activeId, overId);
        }
      } else if (activeId && over.id === 'root-drop-area') {
        // Move to root level
        moveTodo(activeId, null);
      }
    }
    
    setActiveId(null);
  };

  // Get time tracking context
  const { formatTime } = useTimeTrackingSafe();

  // Calculate overall statistics
  const stats = getTotalStats(searchQuery ? filteredTodos : todos);
  const hasTrackedTime = stats.totalTimeSpent > 0;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      {/* Alert for todos due today */}
      <DueTodayAlert />
      <Card className="w-full mx-auto">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{activeList?.name || 'Todo List'}</span>
            {stats.total > 0 && (
              <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                <span>
                  {stats.completed}/{stats.total} tasks completed
                </span>
                {hasTrackedTime && (
                  <TimeDisplay 
                    seconds={stats.totalTimeSpent} 
                    size="sm" 
                    className="ml-1" 
                  />
                )}
              </div>
            )}
          </CardTitle>
          {stats.total > 0 && (
            <div className="mt-2">
              <ProgressWithText 
                value={stats.completionPercentage} 
                total={stats.total} 
                completed={stats.completed} 
                size="lg" 
              />
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2">
                <Input
                  placeholder="Add a new todo..."
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Toggle
                        aria-label="Toggle wrap todos"
                        pressed={wrapTodosEnabled}
                        onPressedChange={setWrapTodosEnabled}
                        className={`${wrapTodosEnabled ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                      >
                        <Layers className="h-4 w-4" />
                      </Toggle>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{wrapTodosEnabled ? 'Wrap all existing todos inside new todo' : 'Add todo normally'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Button onClick={handleAddTodo}>
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
              <ImportDialog parentId={null} />
              <ExportDialog />
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <TodoActions 
              onExpandAll={expandAllTodos}
              onCollapseAll={collapseAllTodos}
              onCollapseCompleted={collapseCompletedTodos}
              onNavigateBookmark={navigateToBookmark}
              onUndo={undo}
              onRedo={redo}
              onSortAscending={sortRootTodosAscending}
              onSortDescending={sortRootTodosDescending}
              onSortByCostAscending={() => sortRootTodosByCost(true)}
              onSortByCostDescending={() => sortRootTodosByCost(false)}
              onSortByStoryPointsAscending={() => sortRootTodosByStoryPoints(true)}
              onSortByStoryPointsDescending={() => sortRootTodosByStoryPoints(false)}
              onSortByTimeEstimateAscending={() => sortRootTodosByTimeEstimate(true)}
              onSortByTimeEstimateDescending={() => sortRootTodosByTimeEstimate(false)}
              globalNotes={globalNotes}
              onGlobalNotesChange={setGlobalNotes}
              canUndo={canUndo}
              canRedo={canRedo}
              hasBookmark={!!bookmarkedTodoId}
            />
            
            {todos.length > 0 && (
              <ClearAllDialog />
            )}
            
            <div className="flex-1 mx-2">
              <SearchBar />
            </div>
          </div>
          
          <div 
            className={`space-y-1 ${activeId ? 'pb-16' : ''}`}
            id="root-drop-area"
          >
            {/* Pinned todos section */}
            {!searchQuery && pinnedTodos.length > 0 && (
              <div className="mb-4">
                <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <line x1="12" y1="17" x2="12" y2="22"></line>
                    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
                  </svg>
                  Pinned Todos
                </div>
                <div className="rounded-md p-2 space-y-1">
                  <AnimatePresence mode="popLayout">
                    {pinnedTodos.map((todo) => (
                      <DraggableTodoItem 
                        key={`pinned-${todo.id}`}
                        todo={todo} 
                        level={0} 
                        activeId={activeId}
                        isLastChild={false}
                      />
                    ))}
                  </AnimatePresence>
                </div>
                <div className="h-px bg-border w-full my-2"></div>
              </div>
            )}
            
            {/* Main todos section */}
            {/* Show appropriate message based on search or empty state */}
            {filteredTodos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery 
                  ? `No todos matching "${searchQuery}"`
                  : "No todos yet. Add one to get started!"}
              </div>
            ) : (
              <>
                {/* Root level drop indicator for first position */}
                {activeId && (
                  <RootDropIndicator position="first" />
                )}
                
                <AnimatePresence mode="popLayout">
                  {filteredTodos.map((todo, index) => (
                    <React.Fragment key={todo.id}>
                      <DraggableTodoItem 
                        todo={todo} 
                        level={0} 
                        activeId={activeId}
                        isLastChild={index === filteredTodos.length - 1} 
                      />
                      
                      {/* Root level drop indicator between items */}
                      {activeId && index < filteredTodos.length - 1 && (
                        <div className="h-1" /> // Spacer
                      )}
                    </React.Fragment>
                  ))}
                </AnimatePresence>
                
                {/* Root level drop indicator for last position */}
                {activeId && filteredTodos.length > 0 && (
                  <RootDropIndicator position="last" />
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </DndContext>
  );
};

export default DraggableTodoList;