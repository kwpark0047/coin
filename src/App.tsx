import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import Dashboard from '@/pages/app/Dashboard';
import Portfolio from '@/pages/app/Portfolio';
import TradingHistory from '@/pages/app/TradingHistory';
import { LayoutDashboard, PieChart, History } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { to: '/portfolio', label: '포트폴리오', icon: PieChart },
  { to: '/history', label: '거래내역', icon: History },
];

function Nav() {
  const location = useLocation();
  return (
    <nav className="flex items-center gap-1 border-b bg-white px-6 py-3">
      <span className="font-display text-lg mr-6">Wemarket Coin</span>
      {navItems.map((item) => {
        const active = location.pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <Nav />
      <main className="mx-auto max-w-7xl px-6 py-6">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/history" element={<TradingHistory />} />
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
