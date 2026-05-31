import { useCallback, useEffect, useState, useRef } from 'react';
import { aggregatePortfolio } from '@/lib/aggregatePortfolio';
import type { AggregateResult } from '@/lib/aggregatePortfolio';

interface PortfolioStats {
  portfolioValueKRW: number;
  btcRatio: number;
  altRatio: number;
  dailyPnL: number;
  trades24h: number;
}

interface UsePortfolioAutoSyncResult {
  stats: PortfolioStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePortfolioAutoSync(): UsePortfolioAutoSyncResult {
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result: AggregateResult = await aggregatePortfolio();
      if (mountedRef.current) {
        setStats({
          portfolioValueKRW: result.summary.portfolioValueKRW,
          btcRatio: result.summary.btcRatio,
          altRatio: result.summary.altRatio,
          dailyPnL: result.summary.dailyPnL,
          trades24h: result.summary.trades24h,
        });
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Sync failed');
      }
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

  return { stats, loading, error, refresh };
}
