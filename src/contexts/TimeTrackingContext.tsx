import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useTodoContext } from './TodoContext';
import { useConfigContext } from './ConfigContext';
import { formatTime } from '@/util/time';

export type TimerStatus = 'idle' | 'running' | 'paused';

interface TimeTrackingContextType {
  timerStatus: TimerStatus;
  elapsedTime: number;
  startTimer: () => void;
  pauseTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  formatTime: (seconds: number) => string;
  currentStartTime: number | null; // Timestamp when the timer was started
}

const TimeTrackingContext = createContext<TimeTrackingContextType | undefined>(undefined);

export const useTimeTracking = () => {
  const context = useContext(TimeTrackingContext);
  if (!context) {
    throw new Error('useTimeTracking must be used within a TimeTrackingProvider');
  }
  return context;
};

export const TimeTrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { config } = useConfigContext();
  const [timerStatus, setTimerStatus] = useState<TimerStatus>('idle');
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  
  // Auto-start timer based on config
  useEffect(() => {
    if (config.timeTracking.autoStartTimer && timerStatus === 'idle') {
      startTimer();
    }
  }, [config.timeTracking.autoStartTimer]);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Start the timer
  const startTimer = () => {
    if (timerStatus === 'running') return;

    setTimerStatus('running');
    startTimeRef.current = Date.now() - (elapsedTime * 1000);
    
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const currentElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedTime(currentElapsed);
      }
    }, 1000);
  };

  // Pause the timer
  const pauseTimer = () => {
    if (timerStatus !== 'running') return;

    setTimerStatus('paused');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Stop the timer and reset
  const stopTimer = () => {
    if (timerStatus === 'idle') return;

    setTimerStatus('idle');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setElapsedTime(0);
    startTimeRef.current = null;
  };

  // Reset the timer but keep it running if it was running
  const resetTimer = () => {
    const wasRunning = timerStatus === 'running';
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setElapsedTime(0);
    startTimeRef.current = wasRunning ? Date.now() : null;
    
    if (wasRunning) {
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const currentElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setElapsedTime(currentElapsed);
        }
      }, 1000);
    }
  };

  return (
    <TimeTrackingContext.Provider
      value={{
        timerStatus,
        elapsedTime,
        startTimer,
        pauseTimer,
        stopTimer,
        resetTimer,
        formatTime,
        currentStartTime: startTimeRef.current
      }}
    >
      {children}
    </TimeTrackingContext.Provider>
  );
};