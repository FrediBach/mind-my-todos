import { useState, useEffect, useRef } from 'react';

/**
 * A hook that returns a throttled version of a value.
 * The throttled value will only update at most once per the specified delay.
 * 
 * @param value The value to throttle
 * @param delay The minimum time between updates in milliseconds
 * @returns The throttled value
 */
export function useThrottledValue<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdated = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeElapsed = now - lastUpdated.current;

    if (timeElapsed >= delay) {
      // If enough time has elapsed, update immediately
      setThrottledValue(value);
      lastUpdated.current = now;
    } else {
      // Otherwise, schedule an update
      const timerId = setTimeout(() => {
        setThrottledValue(value);
        lastUpdated.current = Date.now();
      }, delay - timeElapsed);

      return () => clearTimeout(timerId);
    }
  }, [value, delay]);

  return throttledValue;
}