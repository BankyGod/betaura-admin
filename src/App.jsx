import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AdminLayout from './components/layout/AdminLayout';
import Home from './pages/Home';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Customers, { CustomerDetail } from './pages/Customers';
import Analytics from './pages/Analytics';
import Referrals from './pages/Referrals';
import Fixtures from './pages/Fixtures';
import TradingDesk from './pages/TradingDesk';
import AuditLogs from './pages/AuditLogs';
import LiveSync from './pages/LiveSync';
import WalletPage from './pages/WalletPage';
import Settings from './pages/Settings';
import Login from './pages/Login';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AdminLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/order-detail" element={<OrderDetail />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/fixtures" element={<Fixtures />} />
            <Route path="/trading" element={<TradingDesk />} />
            <Route path="/customer-detail" element={<CustomerDetail />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/live-sync" element={<LiveSync />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
