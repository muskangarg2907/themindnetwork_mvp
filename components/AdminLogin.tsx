import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!password) { setError('Enter password'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem('adminToken', data.token);
        navigate('/admin');
      } else {
        setError('Invalid password');
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
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
            label="Password"
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLogin();
            }}
          />
          
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </div>
          )}

          <Button className="w-full" onClick={handleLogin} disabled={loading}>
            {loading ? <><i className="fas fa-spinner fa-spin mr-2"></i>Verifying...</> : <><i className="fas fa-sign-in-alt mr-2"></i>Login</>}
          </Button>
        </div>
      </div>
    </div>
  );
};
