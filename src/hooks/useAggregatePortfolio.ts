import { useCallback, useEffect, useState, useRef } from 'react';
import { aggregatePortfolio } from '@/lib/aggregatePortfolio';
import type { AggregateResult } from '@/lib/aggregatePortfolio';

interface UseAggregatePortfolioResult {
  data: AggregateResult | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAggregatePortfolio(autoRefreshMs?: number): UseAggregatePortfolioResult {
  const [data, setData] = useState<AggregateResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await aggregatePortfolio();
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to aggregate portfolio';
      if (mountedRef.current) {
        setError(message);
      }
      console.error('useAggregatePortfolio error:', err);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    return () => { mountedRef.current = false; };
  }, [refresh]);

  useEffect(() => {
    if (!autoRefreshMs || autoRefreshMs <= 0) return;
    const id = setInterval(refresh, autoRefreshMs);
    return () => clearInterval(id);
  }, [autoRefreshMs, refresh]);

  return { data, loading, error, refresh };
}
