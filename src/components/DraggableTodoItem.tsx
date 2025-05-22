import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import TodoItem from './TodoItem';
import NestingLines from './NestingLines';
import { TodoItem as TodoItemType, useTodoContext } from '@/contexts/TodoContext';
import { AnimatePresence } from 'framer-motion';

interface DraggableTodoItemProps {
  todo: TodoItemType;
  level: number;
  activeId: string | null;
  isLastChild?: boolean;
}

const DraggableTodoItem: React.FC<DraggableTodoItemProps> = ({ todo, level, activeId, isLastChild = false }) => {
  const { expandTodo, lastModifiedTodoId } = useTodoContext();
  
  // Set up draggable
  const { attributes, listeners, setNodeRef: setDraggableNodeRef, transform, isDragging } = useDraggable({
    id: `draggable-${todo.id}`,
    data: {
      type: 'todo',
      id: todo.id,
      parentId: todo.parentId,
    },
  });

  // Set up droppable
  const { setNodeRef: setDroppableNodeRef, isOver, over } = useDroppable({
    id: `droppable-${todo.id}`,
    data: {
      type: 'todo',
      id: todo.id,
      parentId: todo.parentId,
      accepts: ['todo'],
    },
  });

  // Set up droppable for before position
  const { setNodeRef: setBeforeDroppableNodeRef, isOver: isOverBefore } = useDroppable({
    id: `droppable-before-${todo.id}`,
    data: {
      type: 'position',
      id: todo.id,
      parentId: todo.parentId,
      position: 'before',
      accepts: ['todo'],
    },
  });

  // Set up droppable for after position
  const { setNodeRef: setAfterDroppableNodeRef, isOver: isOverAfter } = useDroppable({
    id: `droppable-after-${todo.id}`,
    data: {
      type: 'position',
      id: todo.id,
      parentId: todo.parentId,
      position: 'after',
      accepts: ['todo'],
    },
  });

  // Combine the main refs
  const setNodeRef = (node: HTMLDivElement | null) => {
    setDraggableNodeRef(node);
    setDroppableNodeRef(node);
  };

  // Auto-expand when dragging over a collapsed todo
  React.useEffect(() => {
    if (isOver && todo.collapsed) {
      expandTodo(todo.id);
    }
  }, [isOver, todo.collapsed, todo.id, expandTodo]);

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 999 : 'auto',
  };

  // Don't show drop indicators when dragging this item
  const isActive = activeId === todo.id;
  const showDropIndicators = activeId && !isActive;

  return (
    <div className="relative">
      {/* Before drop zone indicator */}
      {showDropIndicators && (
        <div 
          ref={setBeforeDroppableNodeRef}
          className="absolute w-full h-2 -top-1 z-10"
          style={{ paddingLeft: `${level * 1.5}rem` }}
        >
          {isOverBefore && (
            <div className="h-1 bg-primary rounded-full w-full animate-pulse" />
          )}
        </div>
      )}

      <div
        ref={setNodeRef}
        style={style}
        className={`draggable-todo-item ${isOver ? 'bg-accent/20 rounded-md' : ''} relative`}
        {...attributes}
        {...listeners}
      >
        {level > 0 && (
          <NestingLines 
            level={level} 
            isLastChild={isLastChild} 
            hasChildren={todo.children.length > 0}
            isCollapsed={todo.collapsed}
          />
        )}
        
        <AnimatePresence mode="popLayout">
          <TodoItem todo={todo} level={0} isDragging={isDragging} />
        </AnimatePresence>
        
        {!todo.collapsed && todo.children.length > 0 && (
          <div className="pl-6 space-y-1 relative">
            <AnimatePresence mode="popLayout">
              {todo.children.map((child, index) => (
                <DraggableTodoItem 
                  key={child.id} 
                  todo={child} 
                  level={level + 1} 
                  activeId={activeId}
                  isLastChild={index === todo.children.length - 1}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* After drop zone indicator */}
      {showDropIndicators && (
        <div 
          ref={setAfterDroppableNodeRef}
          className="absolute w-full h-2 -bottom-1 z-10"
          style={{ paddingLeft: `${level * 1.5}rem` }}
        >
          {isOverAfter && (
            <div className="h-1 bg-primary rounded-full w-full animate-pulse" />
          )}
        </div>
      )}
    </div>
  );
};

export default DraggableTodoItem;