import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export function AIBriefing() {
  return (
    <Card className="glass p-4 md:p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-accent" />
        <h3 className="font-display text-sm font-semibold">AI 브리핑</h3>
      </div>
      <div className="py-6 text-center">
        <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
        <p className="text-xs text-muted-foreground">
          AI 기반 시장 분석 리포트는 준비 중입니다.
        </p>
      </div>
    </Card>
  );
}
