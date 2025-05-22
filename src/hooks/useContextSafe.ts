import { useContext } from 'react';

/**
 * Safely access a React context with fallback values
 * @param contextHook - The context hook to use
 * @param fallbackValue - Fallback value to use if context is not available
 * @returns The context value or fallback value
 */
export function useContextSafe<T>(contextHook: () => T, fallbackValue: T): T {
  try {
    return contextHook();
  } catch (error) {
    return fallbackValue;
  }
}

/**
 * Safely access the TodoContext
 */
export const useTodoContextSafe = () => {
  try {
    // Dynamic import to avoid SSR issues
    const { useTodoContext } = require('@/contexts/TodoContext');
    return useTodoContext();
  } catch (error) {
    // Return a dummy object if context is not available
    return {
      todos: [],
      filteredTodos: [],
      searchQuery: '',
      toggleTodo: () => {},
      editTodo: () => {},
      removeTodo: () => {},
      toggleCollapse: () => {},
      duplicateTodo: () => {},
      combineTodo: () => {},
      addTodo: () => {},
      splitTodo: () => {},
      lastModifiedTodoId: null,
      expandTodo: () => {},
      expandAllTodos: () => {},
      collapseAllTodos: () => {},
      collapseCompletedTodos: () => {},
      undo: () => {},
      redo: () => {},
      canUndo: false,
      canRedo: false,
      toggleBookmark: () => {},
      navigateToBookmark: () => {},
      bookmarkedTodoId: null,
      globalNotes: '',
      setGlobalNotes: () => {},
      sortChildrenAscending: () => {},
      sortChildrenDescending: () => {}
    };
  }
};

/**
 * Safely access the TimeTrackingContext
 */
export const useTimeTrackingSafe = () => {
  try {
    const { useTimeTracking } = require('@/contexts/TimeTrackingContext');
    return useTimeTracking();
  } catch (error) {
    // Import the formatTime utility for the fallback
    const { formatTime } = require('@/util/time');
    
    // Return a dummy object if context is not available
    return {
      timerStatus: 'idle',
      elapsedTime: 0,
      startTimer: () => {},
      pauseTimer: () => {},
      stopTimer: () => {},
      resetTimer: () => {},
      formatTime
    };
  }
};