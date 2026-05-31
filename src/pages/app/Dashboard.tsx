import { StatCard } from "@/components/widgets/StatCard";
import { PortfolioChart } from "@/components/widgets/PortfolioChart";
import { AllocationChart } from "@/components/widgets/AllocationChart";
import { AIBriefing } from "@/components/widgets/AIBriefing";
import { RiskScore } from "@/components/widgets/RiskScore";
import { WhaleAlerts } from "@/components/widgets/WhaleAlerts";
import { CorrelationAnalysis } from "@/components/widgets/CorrelationAnalysis";
import { Wallet, TrendingUp, Activity, Bitcoin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CoinOneTicker } from "@/components/widgets/CoinOneTicker";
import { usePortfolioAutoSync } from "@/hooks/usePortfolioAutoSync";
import { formatKRW } from "@/lib/utils";

export default function Dashboard() {
  const { user } = useAuth();
  const { stats, loading, refresh } = usePortfolioAutoSync();

  if (loading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        \ub370\uc774\ud130\ub97c \ubd88\ub7ec\uc624\ub294 \uc911...
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
              {`\ud604\uc7ac \uc2dc\uac04\uc740 ${new Date().toLocaleTimeString('ko-KR', { hour: 'numeric', minute: 'numeric' })} \uc785\ub2c8\ub2e4, ${user?.nickname || ''}\ub2d8`}
            </h1>
            <p className="text-sm text-muted-foreground">
              \ud604\uc7ac \ud3ec\ud2b8\ud3f4\ub9ac\uc624 \uc0c1\ud669\uc785\ub2c8\ub2e4.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 text-sm bg-primary-100 hover:bg-primary-200 rounded"
              onClick={refresh}
            >
              \uc0c8\ub85c\uace0\uce68
            </button>
            <div className="text-xs font-mono text-muted-foreground">
              {stats ? '\ucd5c\uadfc \ub3d9\uae30\ud654 \uc644\ub8cc' : '\ub3d9\uae30\ud654 \ub300\uae30 \uc911'} | {new Date().toLocaleTimeString('ko-KR')}
            </div>
          </div>
        </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="\ud3ec\ud2b8\ud3f4\ub9ac\uc624 \uac00\uce58"
          value={stats ? formatKRW(stats.portfolioValueKRW) : "--"}
          delta={stats && stats.portfolioValueKRW && stats.dailyPnL ? (stats.dailyPnL / (stats.portfolioValueKRW - stats.dailyPnL)) * 100 : 0}
          icon={Wallet}
          accent="primary"
        />
        <StatCard
          label="\uc77c\uac04 \uc190\uc775"
          value={stats ? `${stats.dailyPnL >= 0 ? "+" : ""}${formatKRW(stats.dailyPnL)}` : "--"}
          delta={stats && stats.portfolioValueKRW && stats.dailyPnL ? (stats.dailyPnL / (stats.portfolioValueKRW - stats.dailyPnL)) * 100 : 0}
          icon={TrendingUp}
          accent="primary"
        />
        <StatCard
          label="BTC/\uc54c\ud2b8 \ube44\uc728"
          value={stats ? `${stats.btcRatio} / ${stats.altRatio}` : "--"}
          hint="\ud3ec\ud2b8\ud3f4\ub9ac\uc624 \ub0b4 BTC \ube44\uc911"
          icon={Bitcoin}
          accent="warning"
        />
        <StatCard
          label="24\uc2dc\uac04 \uac70\ub798"
          value={stats ? `${stats.trades24h}` : "--"}
          delta={0}
          icon={Activity}
          accent="accent"
        />
      </div>
      <CoinOneTicker />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <PortfolioChart />
          <AllocationChart />
        </div>
        <div className="space-y-4">
          <AIBriefing />
          <CorrelationAnalysis />
          <RiskScore score={38} />
          <WhaleAlerts />
        </div>
      </div>
    </div>
  );
}
