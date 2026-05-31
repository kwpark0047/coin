export interface CorrelationPair {
  assetA: string;
  assetB: string;
  coefficient: number; // -1 ~ 1
  label: string;
  description: string;
}

/**
 * 피어슨 상관계수 (Pearson correlation coefficient)
 * r = \u03a3((xi-x\u0304)(yi-\u0305y)) / \u221a(\u03a3(xi-x\u0304)\u00b2 \u03a3(yi-\u0305y)\u00b2)
 */
export function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, denomX = 0, denomY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  const denom = Math.sqrt(denomX * denomY);
  return denom === 0 ? 0 : Math.max(-1, Math.min(1, num / denom));
}

/**
 * 시드 상관관계 데이터
 * 실제 과거 데이터 기반 근사치, 지속적으로 업데이트 필요
 */
export function getSeedCorrelations(): CorrelationPair[] {
  return [
    {
      assetA: 'BTC',
      assetB: 'Nasdaq',
      coefficient: 0.42,
      label: 'BTC vs \ub098\uc2a4\ub2e5',
      description: 'BTC\ub294 \uae30\uc220\uc8fc\uc640 \uc911\uac04 \uc815\ub3c4\uc758 \uc591\uc758 \uc0c1\uad00\uad00\uacc4\ub97c \ubcf4\uc785\ub2c8\ub2e4. \uc704\ud5d8\uc790\uc0b0 \uc120\ud638 \uc2ec\ub9ac\uac00 \ubc18\uc601\ub429\ub2c8\ub2e4.',
    },
    {
      assetA: 'BTC',
      assetB: 'KOSPI',
      coefficient: 0.28,
      label: 'BTC vs \ucf54\uc2a4\ud53c',
      description: 'BTC\uc640 \ucf54\uc2a4\ud53c\ub294 \uc57d\ud55c \uc591\uc758 \uc0c1\uad00\uad00\uacc4\ub97c \ubcf4\uc785\ub2c8\ub2e4. \uae00\ub85c\ubc8c \uc720\ub3d9\uc131\uc5d0 \ub3d9\uc2dc\uc5d0 \uc601\ud5a5\uc744 \ubc1b\uc2b5\ub2c8\ub2e4.',
    },
    {
      assetA: 'BTC',
      assetB: 'USD/KRW',
      coefficient: -0.18,
      label: 'BTC vs \uc6d0/\ub2ec\ub7ec',
      description: '\uc57d\ud55c \uc74c\uc758 \uc0c1\uad00\uad00\uacc4\ub85c, \ub2ec\ub7ec \uc57d\uc138 \uc2dc BTC \uac15\uc138\ub97c \ubcf4\uc774\ub294 \uacbd\ud5a5\uc774 \uc788\uc2b5\ub2c8\ub2e4.',
    },
    {
      assetA: '\uad6d\ub0b4 \uc8fc\uc2dd',
      assetB: '\ubbf8\uad6d \uc8fc\uc2dd',
      coefficient: 0.65,
      label: '\uad6d\ub0b4 vs \ubbf8\uad6d \uc8fc\uc2dd',
      description: '\ubbf8\uad6d \uc99d\uc2dc\uc640 \ud55c\uad6d \uc99d\uc2dc\ub294 \ube44\uad50\uc801 \uac15\ud55c \uc591\uc758 \uc0c1\uad00\uad00\uacc4\ub97c \ubcf4\uc785\ub2c8\ub2e4. \uae00\ub85c\ubc8c \uacbd\uae30 \uc21c\ud658\uc744 \uacf5\uc720\ud569\ub2c8\ub2e4.',
    },
    {
      assetA: '\uc554\ud638\ud654\ud3d0',
      assetB: '\uae08',
      coefficient: 0.15,
      label: '\uc554\ud638\ud654\ud3d0 vs \uae08',
      description: '\uc554\ud638\ud654\ud3d0\uc640 \uae08\uc740 \uc0c1\uad00\uad00\uacc4\uac00 \ub0ae\uc544, \ud568\uaed8 \ubcf4\uc720 \uc2dc \ubd84\uc0b0 \ud6a8\uacfc\ub97c \uae30\ub300\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.',
    },
  ];
}

/**
 * 상관관계 매트릭스 조회 (시드 데이터 + 로컬 누적 데이터)
 * 향후 localStorage 누적 데이터와 병합 가능
 */
export function getCorrelationMatrix(): CorrelationPair[] {
  return getSeedCorrelations();
}
