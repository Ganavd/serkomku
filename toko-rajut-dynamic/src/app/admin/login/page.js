'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username dan Password wajib diisi.');
      return;
    }

    if (username === 'admin' && password === 'adminrajajutan123') {
      localStorage.setItem('admin_token', 'logged_in');
      router.push('/admin/dashboard');
    } else {
      setError('Username atau Password yang Anda masukkan tidak cocok.');
    }
  };

  return (
    <main style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '380px', padding: '36px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            border: '1px solid #bfdbfe'
          }}>
            <Lock size={24} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', lineHeight: 1.3 }}>
            <span style={{ display: 'block' }}>Administrasi</span>
            <span style={{ display: 'block' }}>Rajajutan Arkana</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '4px' }}>
            Masuk ke panel pengelola sistem
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '12px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="form-group">
            <label style={{ fontWeight: 600, fontSize: '0.88rem', color: '#334155', marginBottom: '6px', display: 'block' }}>Username</label>
            <input
              type="text"
              className="form-input"
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 600, fontSize: '0.88rem', color: '#334155', marginBottom: '6px', display: 'block' }}>Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            style={{ padding: '12px', fontSize: '0.95rem', fontWeight: 700, borderRadius: '8px', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <ShieldCheck size={18} /> Masuk Panel Admin
          </button>
        </form>
      </div>
    </main>
  );
}

