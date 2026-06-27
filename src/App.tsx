import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'sonner';
import { LayoutDashboard, PieChart, History, Calculator, Settings as SettingsIcon } from 'lucide-react';

const Dashboard = lazy(() => import('@/pages/app/Dashboard'));
const Portfolio = lazy(() => import('@/pages/app/Portfolio'));
const TradingHistory = lazy(() => import('@/pages/app/TradingHistory'));
const TaxAndFire = lazy(() => import('@/pages/app/TaxAndFire'));
const Settings = lazy(() => import('@/pages/app/Settings'));

const navItems = [
  { to: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { to: '/portfolio', label: '포트폴리오', icon: PieChart },
  { to: '/history', label: '거래내역', icon: History },
  { to: '/tax-fire', label: '세금/FIRE', icon: Calculator },
  { to: '/settings', label: '설정', icon: SettingsIcon },
];

function Nav() {
  const location = useLocation();
  return (
    <nav className="flex items-center gap-1 border-b bg-white px-4 md:px-6 py-2.5">
      <span className="font-display text-base md:text-lg mr-6 md:mr-8 tracking-tight">Wemarket Coin</span>
      {navItems.map((item) => {
        const active = location.pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? 'page' : undefined}
            aria-label={`${item.label} 페이지로 이동`}
            className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <item.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <Toaster position="top-right" richColors />
      <Nav />
      <main className="mx-auto max-w-7xl px-6 py-6">
        <Suspense fallback={
          <div className="flex items-center justify-center py-20">
            <div className="text-sm text-muted-foreground animate-pulse">로딩 중...</div>
          </div>
        }>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/history" element={<TradingHistory />} />
            <Route path="/tax-fire" element={<TaxAndFire />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
