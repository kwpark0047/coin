import { Card } from '@/components/ui/card';
import { Radio } from 'lucide-react';

export function WhaleAlerts() {
  return (
    <Card className="glass p-4 md:p-5">
      <h3 className="font-display text-sm font-semibold mb-3">고래 경보</h3>
      <div className="py-6 text-center">
        <Radio className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">
          대규모 거래 모니터링 기능은 준비 중입니다.
        </p>
      </div>
    </Card>
  );
}
