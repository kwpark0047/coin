import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { loadJournal } from '@/lib/tradeJournal';
import type { TradeEntry } from '@/lib/tradeJournal';
import { formatKRW } from '@/lib/utils';
import { BookOpen } from 'lucide-react';

export default function TradingHistory() {
  const [entries, setEntries] = useState<TradeEntry[]>([]);

  useEffect(() => {
    setEntries(loadJournal());
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl md:text-2xl font-semibold tracking-tight">
          거래 내역
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          매매 일지에 기록된 모든 거래를 확인합니다.
        </p>
      </div>
      <Card className="glass p-4 md:p-5">
        {entries.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-1">
              아직 기록된 거래 내역이 없습니다.
            </p>
            <p className="text-xs text-muted-foreground">
              대시보드의 매매 일지에서 거래를 기록하면 이곳에 표시됩니다.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>시간</TableHead>
                <TableHead>자산</TableHead>
                <TableHead>유형</TableHead>
                <TableHead className="text-right">수량</TableHead>
                <TableHead className="text-right">가격 (KRW)</TableHead>
                <TableHead className="text-right">금액 (KRW)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...entries].sort((a, b) => b.timestamp - a.timestamp).map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(t.timestamp).toLocaleDateString('ko-KR', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell className="font-mono text-sm font-medium">{t.symbol}</TableCell>
                  <TableCell>
                    <span className={`text-sm font-medium ${t.type === 'buy' ? 'text-bull' : 'text-bear'}`}>
                      {t.type === 'buy' ? '매수' : '매도'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{t.amount}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatKRW(t.price)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                    {formatKRW(t.amount * t.price)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
