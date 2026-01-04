import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Landing } from './components/Landing';
import { Login } from './components/Login';
import { ProfileWizard } from './components/ProfileWizard';
import { ProfileView } from './components/ProfileView';
import { PlanSelection } from './components/PlanSelection';
import { Payment } from './components/Payment';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLogin } from './components/AdminLogin';
import { FirebaseDiagnostic } from './components/FirebaseDiagnostic';
import ProviderPage from './components/ProviderPage';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/create" element={<ProfileWizard />} />
        <Route path="/profile" element={<ProfileView />} />
        <Route path="/plans" element={<PlanSelection />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/firebase-test" element={<FirebaseDiagnostic />} />
        <Route path="/provider" element={<ProviderPage />} />
      </Routes>
    </HashRouter>
  );
};

export default App;