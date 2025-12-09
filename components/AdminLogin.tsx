import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

const ADMIN_USERNAME = 'admin123';
const ADMIN_PASSWORD = 'muskanadmin123';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem('adminAuth', 'authenticated');
      navigate('/admin');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
            <i className="fas fa-user-shield"></i>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Admin Portal</h1>
          <p className="text-slate-500">Secure access for administrators</p>
        </div>

        <div className="space-y-4">
          <Input
            label="Username"
            placeholder="Enter admin username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError('');
            }}
            error={error}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleLogin();
              }
            }}
            error={error}
          />
          
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </div>
          )}

          <Button className="w-full" onClick={handleLogin}>
            <i className="fas fa-sign-in-alt mr-2"></i> Login
          </Button>
        </div>
      </div>
    </div>
  );
};
