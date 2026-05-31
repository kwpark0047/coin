import { Card } from '@/components/ui/card';

const alerts = [
  { exchange: 'Binance', symbol: 'BTC', amount: '1,234', time: '2분 전', type: 'buy' },
  { exchange: 'CoinOne', symbol: 'ETH', amount: '5,678', time: '15분 전', type: 'sell' },
  { exchange: 'Binance', symbol: 'SOL', amount: '12,345', time: '31분 전', type: 'buy' },
];

export function WhaleAlerts() {
  return (
    <Card className="glass p-5">
      <h3 className="font-display font-semibold mb-3">고래 경보</h3>
      <div className="space-y-2">
        {alerts.map((a, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${a.type === 'buy' ? 'bg-bull' : 'bg-bear'}`} />
              <span className="font-medium">{a.exchange}</span>
              <span className="font-mono">{a.symbol}</span>
            </div>
            <div className="text-muted-foreground">
              <span className="font-mono">{a.amount}</span>
              <span className="ml-2">{a.time}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
