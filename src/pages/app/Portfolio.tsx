import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, Wallet, AlertTriangle } from 'lucide-react';
import { useAggregatePortfolio } from '@/hooks/useAggregatePortfolio';
import { TotalAllocationChart } from '@/components/widgets/TotalAllocationChart';
import { CorrelationAnalysis } from '@/components/widgets/CorrelationAnalysis';
import { formatKRW, formatNumber, formatPercent } from '@/lib/utils';

const Portfolio = () => {
  const { data, loading, error, refresh } = useAggregatePortfolio(120_000);

  const summary = data?.summary;
  const holdings = data?.holdings ?? [];
  const breakdown = data?.classBreakdown ?? [];
  const exchangeRate = data?.exchangeRate ?? 0;

  const btcRatio = summary?.totalValueKRW
    ? (summary.btcValueKRW / summary.totalValueKRW) * 100
    : 0;
  const altRatio = summary?.totalValueKRW
    ? (summary.altValueKRW / summary.totalValueKRW) * 100
    : 0;

  // 거래소별 보유 자산수
  const exchangeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const h of holdings) {
      counts[h.exchange] = (counts[h.exchange] || 0) + 1;
    }
    return counts;
  }, [holdings]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
            \ud1b5\ud569 \ud3ec\ud2b8\ud3f4\ub9ac\uc624
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            \ubaa8\ub4e0 \uac70\ub798\uc18c \uc790\uc0b0\uc744 \ud1b5\ud569\ud55c \ucd1d\ud568\uaca9 \ubc0f \ubd84\uc11d
          </p>
        </div>
        <Button onClick={refresh} disabled={loading} className="gap-2">
          <RefreshCw
            className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
          />
          \uc0c8\ub85c\uace0\uce68
        </Button>
      </div>

      {/* 에러 및 상태 표시 */}
      {(error || data?.errors?.length) ? (
        <Card className="glass p-4 flex items-start gap-3 border-bear/30">
          <AlertTriangle className="h-5 w-5 text-bear mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-medium text-bear">
              \uc77c\ubd80 \uac70\ub798\uc18c \uc5f0\uacb0 \uc624\ub958
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {error || data?.errors?.join('; ')}
            </p>
          </div>
        </Card>
      ) : null}

      {/* 통합 파이 차트 + 상관관계 분석 */}
      {!loading && holdings.length > 0 ? (
        <>
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <TotalAllocationChart
                breakdown={breakdown}
                totalValueKRW={summary?.totalValueKRW ?? 0}
                exchangeRate={exchangeRate}
              />
            </div>
            <div>
              <CorrelationAnalysis />
            </div>
          </div>

          {/* 요약 stat 카드 */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="glass p-5">
              <div className="text-sm text-muted-foreground">
                \ucd1d \ud3ec\ud2b8\ud3f4\ub9ac\uc624 \uac00\uce58
              </div>
              <div className="mt-2 font-display text-3xl font-semibold">
                {formatKRW(summary?.totalValueKRW ?? 0)}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground font-mono">
                \ud658\uc728: {formatKRW(exchangeRate)}/USD
              </div>
            </Card>
            <Card className="glass p-5">
              <div className="text-sm text-muted-foreground">
                \ubcf4\uc720 \uc790\uc0b0
              </div>
              <div className="mt-2 font-display text-3xl font-semibold">
                {summary?.holdingCount ?? 0}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground font-mono">
                {Object.entries(exchangeCounts)
                  .map(([ex, count]) => `${ex}: ${count}`)
                  .join(' | ')}
              </div>
            </Card>
            <Card className="glass p-5">
              <div className="text-sm text-muted-foreground">
                BTC \ube44\uc911
              </div>
              <div className="mt-2 font-display text-3xl font-semibold">
                {formatPercent(btcRatio)}
              </div>
              <Progress value={btcRatio} className="mt-3" />
            </Card>
            <Card className="glass p-5">
              <div className="text-sm text-muted-foreground">
                \uc54c\ud2b8 \ube44\uc911
              </div>
              <div className="mt-2 font-display text-3xl font-semibold">
                {formatPercent(altRatio)}
              </div>
              <Progress value={altRatio} className="mt-3" />
            </Card>
          </div>

          {/* 보유 자산 테이블 */}
          <Card className="glass p-5">
            <div className="mb-4 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <h2 className="font-display font-semibold">
                \ubcf4\uc720 \uc790\uc0b0 \ubaa9\ub85d
              </h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>\uc790\uc0b0</TableHead>
                  <TableHead>\uac70\ub798\uc18c</TableHead>
                  <TableHead className="text-right">
                    \ubcf4\uc720\ub7c9
                  </TableHead>
                  <TableHead className="text-right">
                    \uac00\uaca9 (KRW)
                  </TableHead>
                  <TableHead className="text-right">
                    \ud3c9\uac00\uae08\uc561 (KRW)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdings.length ? (
                  [...holdings]
                    .sort((a, b) => b.valueKRW - a.valueKRW)
                    .map((holding) => (
                      <TableRow
                        key={`${holding.exchange}-${holding.symbol}`}
                      >
                        <TableCell className="font-mono">
                          {holding.symbol}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {holding.exchange}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNumber(holding.amount)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatKRW(holding.priceKRW)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatKRW(holding.valueKRW)}
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      \ub85c\ub4dc\ub41c \ubcf4\uc720 \uc790\uc0b0\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.
                      Settings\uc5d0\uc11c \uac70\ub798\uc18c\ub97c \uc5f0\uacb0\ud574\uc8fc\uc138\uc694.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </>
      ) : !loading ? (
        /* 빈 상태 */
        <Card className="glass p-8 text-center">
          <Wallet className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h2 className="font-display text-lg font-semibold mb-1">
            \uc5f0\uacb0\ub41c \uac70\ub798\uc18c\uac00 \uc5c6\uc2b5\ub2c8\ub2e4
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Settings\uc5d0\uc11c \uac70\ub798\uc18c\ub97c \uc5f0\uacb0\ud558\uba74
            \ud3ec\ud2b8\ud3f4\ub9ac\uc624\uac00 \uc790\ub3d9\uc73c\ub85c \ubd88\ub7ec\uc628\ub2c8\ub2e4.
          </p>
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw
              className={
                loading ? 'h-4 w-4 animate-spin mr-2' : 'h-4 w-4 mr-2'
              }
            />
            \uc7ac\uc2dc\ub3c4
          </Button>
        </Card>
      ) : null}
    </div>
  );
};

export default Portfolio;
