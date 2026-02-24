import { useState, useCallback } from 'react';

// Simple hook to run async actions and expose a loading state.
// Usage: const { run, loading } = useAsyncAction(); run(() => doSomething());
export default function useAsyncAction() {
  const [loading, setLoading] = useState(false);

  const run = useCallback(async (fn) => {
    try {
      setLoading(true);
      const result = await fn();
      setLoading(false);
      return result;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  }, []);

  return { run, loading };
}
