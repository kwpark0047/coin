import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'sonner';
import Dashboard from '@/pages/app/Dashboard';
import Portfolio from '@/pages/app/Portfolio';
import TradingHistory from '@/pages/app/TradingHistory';
import TaxAndFire from '@/pages/app/TaxAndFire';
import { LayoutDashboard, PieChart, History, Calculator } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { to: '/portfolio', label: '포트폴리오', icon: PieChart },
  { to: '/history', label: '거래내역', icon: History },
  { to: '/tax-fire', label: '세금/FIRE', icon: Calculator },
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
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/history" element={<TradingHistory />} />
          <Route path="/tax-fire" element={<TaxAndFire />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
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
