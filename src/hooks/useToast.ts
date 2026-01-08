import { useState, useRef, useCallback } from 'react';

/**
 * Hook for managing toast notifications
 */
export function useToast(duration = 1800) {
  const [toast, setToast] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = window.setTimeout(() => {
      setToast(null);
    }, duration);
  }, [duration]);

  const hideToast = useCallback(() => {
    setToast(null);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
  }, []);

  return { toast, showToast, hideToast };
}

