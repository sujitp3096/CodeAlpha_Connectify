import { useCallback, useState } from 'react';
export function useToast() {
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(window.__connectifyToastTimer);
    window.__connectifyToastTimer = window.setTimeout(() => setToast(null), 3200);
  }, []);
  return { toast, showToast };
}
