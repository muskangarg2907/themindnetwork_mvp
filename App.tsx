import React, { useEffect } from 'react';
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
import { PsychSnapshot } from './components/PsychSnapshot';
import { SnapshotView } from './components/SnapshotView';
import { Dashboard } from './components/Dashboard';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const App: React.FC = () => {
  // Global auth state listener - persists across all tabs
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('[App] User authenticated:', user.phoneNumber);
        // Store user info in localStorage for easy access across components
        localStorage.setItem('user_phone', user.phoneNumber || '');
        localStorage.setItem('user_uid', user.uid);
        localStorage.setItem('user_authenticated', 'true');
      } else {
        console.log('[App] User not authenticated');
        localStorage.removeItem('user_phone');
        localStorage.removeItem('user_uid');
        localStorage.removeItem('user_authenticated');
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create" element={<ProfileWizard />} />
        <Route path="/profile" element={<ProfileView />} />
        <Route path="/plans" element={<PlanSelection />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/firebase-test" element={<FirebaseDiagnostic />} />
        <Route path="/provider" element={<ProviderPage />} />
        <Route path="/snapshot" element={<PsychSnapshot />} />
        <Route path="/snapshot/:snapshotId" element={<SnapshotView />} />
      </Routes>
    </HashRouter>
  );
};

export default App;