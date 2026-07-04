import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Splash from './pages/Splash';
import Login from './pages/Login';
import Payment from './pages/Payment';
import PaymentStatus from './pages/PaymentStatus';
import Dashboard from './pages/Dashboard';
import BlockDetail from './pages/BlockDetail';
import FormWizard from './pages/FormWizard';
import Recapitulation from './pages/Recapitulation';
import SyncHistory from './pages/SyncHistory';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import { syncData } from './lib/sync';
import { RespondentDB } from './db/db';
import useAuthStore from './stores/authStore';

export default function App() {
  const initAuth = useAuthStore(state => state.initAuth);

  React.useEffect(() => {
    initAuth();
    const handleOnline = async () => {
      const pending = await RespondentDB.getAllPending();
      if (pending.length > 0) {
        await syncData();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/payment" element={<ProtectedRoute requirePayment={false}><Payment /></ProtectedRoute>} />
        <Route path="/payment-status" element={<ProtectedRoute requirePayment={false}><PaymentStatus /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/block/:id" element={<ProtectedRoute><BlockDetail /></ProtectedRoute>} />
        <Route path="/wizard/:respondentId" element={<ProtectedRoute><FormWizard /></ProtectedRoute>} />
        <Route path="/recap/:respondentId" element={<ProtectedRoute><Recapitulation /></ProtectedRoute>} />
        <Route path="/sync" element={<ProtectedRoute><SyncHistory /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
