import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Login } from './components/Login';
import { ProfileWizard } from './components/ProfileWizard';
import { ProfileView } from './components/ProfileView';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLogin } from './components/AdminLogin';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/create" element={<ProfileWizard />} />
        <Route path="/profile" element={<ProfileView />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </HashRouter>
  );
};

export default App;