import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export function AIBriefing() {
  return (
    <Card className="glass p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-accent" />
        <h3 className="font-display font-semibold">AI 브리핑</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        현재 비트코인이 65,000달러 선에서 안정적인 흐름을 보이고 있습니다.
        미국 증시와의 상관관계가 0.42로 중간 수준을 유지하며,
        단기 변동성은 낮은 편입니다.
      </p>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
        포트폴리오 내 알트코인 비중이 증가 추세이나,
        BTC 대비 상대 강도는 약화되고 있습니다.
      </p>
    </Card>
  );
}
