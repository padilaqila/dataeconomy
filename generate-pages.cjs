const fs = require('fs');
const path = require('path');

const pages = [
  'Splash',
  'Login',
  'Payment',
  'PaymentStatus',
  'Dashboard',
  'BlockDetail',
  'FormWizard',
  'Recapitulation',
  'SyncHistory',
  'Settings'
];

pages.forEach(page => {
  const content = `import React from 'react';

export default function ${page}() {
  return (
    <div className="p-8">
      <h1 className="mb-4">${page}</h1>
      <p className="font-mono">This is the ${page} page. Edit me later.</p>
    </div>
  );
}
`;
  fs.writeFileSync(path.join(__dirname, 'src', 'pages', `${page}.jsx`), content);
});

// App.jsx
const appContent = `import React from 'react';
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/payment-status" element={<PaymentStatus />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/block/:id" element={<BlockDetail />} />
        <Route path="/wizard/:respondentId" element={<FormWizard />} />
        <Route path="/recap/:respondentId" element={<Recapitulation />} />
        <Route path="/sync" element={<SyncHistory />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
`;
fs.writeFileSync(path.join(__dirname, 'src', 'App.jsx'), appContent);

console.log('Pages generated!');
