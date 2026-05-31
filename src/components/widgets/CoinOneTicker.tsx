import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerData {
  symbol: string;
  price: number;
  change: number;
}

const SYMBOLS = ['BTC', 'ETH', 'SOL', 'XRP'];

export function CoinOneTicker() {
  const [tickers, setTickers] = useState<TickerData[]>([]);

  useEffect(() => {
    const fetchTickers = async () => {
      try {
        const results = await Promise.all(
          SYMBOLS.map(async (s) => {
            const res = await fetch(`https://api.coinone.co.kr/ticker?currency=${s}`);
            const data = await res.json();
            return {
              symbol: s,
              price: parseFloat(data.last),
              change: data.yesterday_last
                ? ((parseFloat(data.last) - parseFloat(data.yesterday_last)) / parseFloat(data.yesterday_last)) * 100
                : 0,
            };
          })
        );
        setTickers(results);
      } catch {
        // silently fail - use mock data
      }
    };
    fetchTickers();
    const id = setInterval(fetchTickers, 30000);
    return () => clearInterval(id);
  }, []);

  if (!tickers.length) {
    return (
      <Card className="glass p-3">
        <div className="flex gap-4 justify-center text-xs text-muted-foreground">
          {SYMBOLS.map((s) => (
            <span key={s} className="font-mono">{s}: --</span>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass p-3">
      <div className="flex gap-4 justify-center text-xs">
        {tickers.map((t) => (
          <div key={t.symbol} className="flex items-center gap-1">
            <span className="font-medium">{t.symbol}</span>
            <span className="font-mono">
              ₩{t.price.toLocaleString('ko-KR')}
            </span>
            <span className={`flex items-center ${t.change >= 0 ? 'text-bull' : 'text-bear'}`}>
              {t.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(t.change).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
