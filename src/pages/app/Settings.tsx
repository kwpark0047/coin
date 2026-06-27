import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  loadConnections,
  saveConnections,
  type ExchangeId,
  type Connections,
} from '@/lib/exchanges';
import {
  ChevronDown,
  ChevronUp,
  Key,
  Plug,
  Unplug,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const EXCHANGE_LABELS: Record<ExchangeId, string> = {
  coinone: 'CoinOne',
  upbit: 'Upbit',
  bithumb: 'Bithumb',
  korbit: 'Korbit',
  binance: 'Binance',
  bybit: 'Bybit',
  okx: 'OKX',
  kraken: 'Kraken',
};

const EXCHANGE_KEYS: Record<ExchangeId, { key: string; label: string; placeholder: string }[]> = {
  coinone: [
    { key: 'access_token', label: 'Access Token', placeholder: '액세스 토큰 입력' },
    { key: 'secret_key', label: 'Secret Key', placeholder: '시크릿 키 입력' },
  ],
  upbit: [
    { key: 'access_token', label: 'Access Key', placeholder: '액세스 키 입력' },
    { key: 'secret_key', label: 'Secret Key', placeholder: '시크릿 키 입력' },
  ],
  bithumb: [
    { key: 'access_token', label: 'API Key', placeholder: 'API 키 입력' },
    { key: 'secret_key', label: 'Secret Key', placeholder: '시크릿 키 입력' },
  ],
  korbit: [
    { key: 'access_token', label: 'API Key', placeholder: 'API 키 입력' },
    { key: 'secret_key', label: 'Secret Key', placeholder: '시크릿 키 입력' },
  ],
  binance: [
    { key: 'apiKey', label: 'API Key', placeholder: 'Binance API 키 입력' },
    { key: 'apiSecret', label: 'API Secret', placeholder: 'Binance API 시크릿 입력' },
  ],
  bybit: [
    { key: 'apiKey', label: 'API Key', placeholder: 'Bybit API 키 입력' },
    { key: 'apiSecret', label: 'API Secret', placeholder: 'Bybit API 시크릿 입력' },
  ],
  okx: [
    { key: 'apiKey', label: 'API Key', placeholder: 'OKX API 키 입력' },
    { key: 'apiSecret', label: 'API Secret', placeholder: 'OKX API 시크릿 입력' },
  ],
  kraken: [
    { key: 'apiKey', label: 'API Key', placeholder: 'Kraken API 키 입력' },
    { key: 'apiSecret', label: 'API Secret', placeholder: 'Kraken API 시크릿 입력' },
  ],
};

export default function Settings() {
  const [connections, setConnections] = useState<Connections>({} as Connections);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<ExchangeId | null>(null);
  const [showSecrets, setShowSecrets] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [usePassphrase, setUsePassphrase] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    loadConnections().then((conns) => {
      setConnections(conns);
      setLoading(false);
    });
  }, []);

  const handleToggle = useCallback(async (id: ExchangeId) => {
    const current = connections[id];
    const newStatus = current?.status === 'connected' ? 'disconnected' : 'connected';

    const updated: Connections = {
      ...connections,
      [id]: {
        status: newStatus,
        keys: newStatus === 'connected' ? (current?.keys ?? {}) : undefined,
      },
    };

    setConnections(updated);
    await saveConnections(updated, usePassphrase ? passphrase : undefined);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, [connections, passphrase, usePassphrase]);

  const handleKeyChange = useCallback((id: ExchangeId, key: string, value: string) => {
    setConnections((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        keys: { ...(prev[id]?.keys ?? {}), [key]: value },
      },
    }));
  }, []);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await saveConnections(connections, usePassphrase ? passphrase : undefined);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } finally {
      setSaving(false);
    }
  };

  const connectedCount = Object.values(connections).filter(
    (c: any) => c.status === 'connected'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-semibold tracking-tight">
            설정
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            거래소 API 키를 관리하고 암호화 설정을 구성합니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-xs text-bull">
              <CheckCircle2 className="h-3.5 w-3.5" /> 저장됨
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1 text-xs text-bear">
              <AlertCircle className="h-3.5 w-3.5" /> 저장 실패
            </span>
          )}
          <Button onClick={handleSaveAll} disabled={saving} className="gap-1.5 h-8 text-xs px-3">
            <Key className="h-3.5 w-3.5" />
            {saving ? '저장 중...' : '모두 저장'}
          </Button>
        </div>
      </div>

      <Card className="glass p-4 md:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-primary" />
          <h2 className="font-display text-sm font-semibold">암호화 설정</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          패스프레이즈를 설정하면 API 키가 패스프레이즈 기반 암호화로 저장됩니다.
          설정하지 않으면 세션 키(브라우저 탭 종료 시 초기화)로 암호화됩니다.
        </p>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={usePassphrase}
            onChange={(e) => setUsePassphrase(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium">패스프레이즈 암호화 사용</span>
        </label>
        {usePassphrase && (
          <div className="mt-3">
            <div className="relative max-w-sm">
              <input
                type={showSecrets ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="암호화에 사용할 패스프레이즈 입력"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={() => setShowSecrets(!showSecrets)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              패스프레이즈를 분실하면 저장된 API 키를 복구할 수 없습니다.
            </p>
          </div>
        )}
      </Card>

      <Card className="glass p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Plug className="h-4 w-4 text-primary" />
            <h2 className="font-display text-sm font-semibold">거래소 연결</h2>
          </div>
          <Badge variant="outline" className="text-xs">
            {connectedCount}/{Object.keys(EXCHANGE_LABELS).length} 연결됨
          </Badge>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            불러오는 중...
          </div>
        ) : (
          <div className="space-y-2">
            {(Object.keys(EXCHANGE_LABELS) as ExchangeId[]).map((id) => {
              const conn = connections[id];
              const isConnected = conn?.status === 'connected';
              const isExpanded = expanded === id;
              const keys = conn?.keys ?? {};

              return (
                <div
                  key={id}
                  className="rounded-xl border bg-white overflow-hidden transition-colors"
                >
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          isConnected ? 'bg-bull' : 'bg-gray-300'
                        }`}
                      />
                      <span className="font-display text-sm font-semibold">
                        {EXCHANGE_LABELS[id]}
                      </span>
                      {isConnected && (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-5 border-bull/30 text-bull bg-bull/5"
                        >
                          연결됨
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => setExpanded(isExpanded ? null : id)}
                        aria-label={isExpanded ? '접기' : '펼치기'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        className={`h-7 text-xs px-2 ${
                          isConnected ? 'text-bear hover:text-bear' : 'text-bull hover:text-bull'
                        }`}
                        onClick={() => handleToggle(id)}
                      >
                        {isConnected ? (
                          <>
                            <Unplug className="h-3.5 w-3.5 mr-1" /> 연결 해제
                          </>
                        ) : (
                          <>
                            <Plug className="h-3.5 w-3.5 mr-1" /> 연결
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t px-4 py-3 space-y-3 bg-gray-50/50">
                      {EXCHANGE_KEYS[id].map((field) => (
                        <div key={field.key}>
                          <label className="font-label block mb-1 text-xs">
                            {field.label}
                          </label>
                          <div className="relative">
                            <input
                              type={showSecrets ? 'text' : 'password'}
                              value={(keys as any)[field.key] ?? ''}
                              onChange={(e) =>
                                handleKeyChange(id, field.key, e.target.value)
                              }
                              placeholder={field.placeholder}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          className="h-7 text-xs px-3"
                          onClick={() => setExpanded(null)}
                        >
                          완료
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="glass p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          API 키는 브라우저에 암호화되어 저장되며, 서버로 전송되지 않습니다.
          모든 거래소 API 요청은 프록시 서버를 통해 이루어집니다.
          {usePassphrase
            ? ' 패스프레이즈 기반 암호화가 활성화되어 있습니다.'
            : ' 현재 세션 키 기반 암호화가 사용 중입니다 (브라우저 탭 종료 시 키 초기화).'}
        </p>
      </Card>
    </div>
  );
}
