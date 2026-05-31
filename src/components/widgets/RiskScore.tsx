import { Card } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface RiskScoreProps {
  score: number;
}

export function RiskScore({ score }: RiskScoreProps) {
  const level = score < 30 ? '안정' : score < 60 ? '보통' : '위험';
  const color = score < 30 ? 'text-bull' : score < 60 ? 'text-warning' : 'text-bear';

  return (
    <Card className="glass p-5">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <h3 className="font-display font-semibold">리스크 점수</h3>
      </div>
      <div className="flex items-end gap-3">
        <span className={`font-display text-3xl font-semibold ${color}`}>
          {score}
        </span>
        <span className="text-sm text-muted-foreground mb-1">/ 100</span>
        <span className={`text-sm font-medium ${color} ml-auto`}>{level}</span>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${
            score < 30 ? 'bg-bull' : score < 60 ? 'bg-warning' : 'bg-bear'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        현재 포트폴리오 리스크는 {level} 수준입니다.
        분산 투자를 통해 리스크를 낮출 수 있습니다.
      </p>
    </Card>
  );
}
