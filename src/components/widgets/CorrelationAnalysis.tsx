import { Card } from '@/components/ui/card';
import { getCorrelationMatrix } from '@/lib/correlationAnalysis';

const colorForCoefficient = (r: number): string => {
  if (r > 0.5) return 'text-green-500';
  if (r > 0.2) return 'text-lime-500';
  if (r > -0.2) return 'text-muted-foreground';
  if (r > -0.5) return 'text-orange-500';
  return 'text-red-500';
};

const bgForCoefficient = (r: number): string => {
  const abs = Math.abs(r);
  if (abs > 0.5) return 'bg-primary/10';
  if (abs > 0.2) return 'bg-accent/5';
  return 'bg-transparent';
};

const barForCoefficient = (r: number): { width: string; color: string } => {
  const pct = Math.abs(r) * 100;
  return {
    width: `${Math.max(pct, 2)}%`,
    color: r > 0 ? 'hsl(var(--primary))' : 'hsl(var(--bear))',
  };
};

export const CorrelationAnalysis = () => {
  const pairs = getCorrelationMatrix();

  return (
    <Card className="glass p-5">
      <h3 className="font-display font-semibold mb-1">
        \uc790\uc0b0 \uac04 \uc0c1\uad00\uad00\uacc4
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        \uacfc\uac70 \ub370\uc774\ud130 \uae30\ubc18 \uc608\uce21 \uc0c1\uad00\uacc4\uc218 (Pearson r)
      </p>
      <div className="space-y-3">
        {pairs.map((pair, idx) => {
          const bar = barForCoefficient(pair.coefficient);
          return (
            <div
              key={idx}
              className={`rounded-lg p-3 transition-colors ${bgForCoefficient(pair.coefficient)}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{pair.label}</span>
                <span
                  className={`font-mono text-sm font-semibold ${colorForCoefficient(pair.coefficient)}`}
                >
                  {pair.coefficient > 0 ? '+' : ''}
                  {pair.coefficient.toFixed(2)}
                </span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: bar.width,
                    background: bar.color,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {pair.description}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
