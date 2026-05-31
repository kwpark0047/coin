import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const mockTrades = [
  { id: '1', symbol: 'BTC', type: 'buy' as const, amount: 0.1, price: 65000000, time: '2026-05-31 10:30' },
  { id: '2', symbol: 'ETH', type: 'sell' as const, amount: 1.5, price: 3500000, time: '2026-05-31 09:15' },
  { id: '3', symbol: 'SOL', type: 'buy' as const, amount: 10, price: 145000, time: '2026-05-30 22:00' },
];

export default function TradingHistory() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
          거래 내역
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          최근 거래 기록을 확인합니다.
        </p>
      </div>
      <Card className="glass p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>시간</TableHead>
              <TableHead>자산</TableHead>
              <TableHead>유형</TableHead>
              <TableHead className="text-right">수량</TableHead>
              <TableHead className="text-right">가격 (KRW)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockTrades.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="text-xs text-muted-foreground">{t.time}</TableCell>
                <TableCell className="font-mono">{t.symbol}</TableCell>
                <TableCell>
                  <span className={t.type === 'buy' ? 'text-bull' : 'text-bear'}>
                    {t.type === 'buy' ? '매수' : '매도'}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono">{t.amount}</TableCell>
                <TableCell className="text-right font-mono">
                  {t.price.toLocaleString('ko-KR')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
