import { useState } from 'react';
import { useAuth } from './AuthContext';
import { Btn, Input, AmbientOrbs } from './components';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode]   = useState('login');   // 'login' | 'register'
  const [form, setForm]   = useState({ name:'', email:'', password:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        if (!form.name.trim()) { setError('Name is required'); setLoading(false); return; }
        await register(form.name, form.email, form.password);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <>
      <AmbientOrbs />
      <div style={{
        position:'relative', zIndex:1, minHeight:'100vh', display:'flex',
        alignItems:'center', justifyContent:'center', padding:16,
      }}>
        <div style={{
          width:'100%', maxWidth:420,
          background:'var(--s1)', border:'1px solid var(--border2)',
          borderRadius:'var(--r-lg)', padding:'36px 32px',
          animation:'fadeUp 0.5s cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow:'var(--shadow-lg)',
        }}>
          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ fontSize:32, fontWeight:900, letterSpacing:'-1px', marginBottom:6 }}>
              <span style={{ background:'linear-gradient(135deg,#6c63ff,#a855f7)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Spend</span>
              <span style={{ color:'var(--muted2)', fontWeight:400 }}>ly</span>
            </div>
            <div style={{ fontSize:13, color:'var(--muted2)' }}>Your personal finance companion</div>
          </div>

          {/* Tab toggle */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', background:'var(--s2)', borderRadius:'var(--r-sm)', padding:4, gap:4, marginBottom:24 }}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }} style={{
                fontFamily:'Cabinet Grotesk', fontWeight:700, fontSize:14, padding:10, borderRadius:7, border:'none', cursor:'pointer', transition:'all 0.2s',
                background:mode===m?'var(--s4)':'transparent',
                color:mode===m?'var(--text)':'var(--muted2)',
                boxShadow:mode===m?'0 2px 8px rgba(0,0,0,0.3)':'none',
              }}>{m==='login'?'Sign In':'Create Account'}</button>
            ))}
          </div>

          {mode === 'register' && (
            <Input label="Full Name" type="text" value={form.name} onChange={set('name')} placeholder="Rahul Sharma" />
          )}
          <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
          <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters"
            style={{ marginBottom: error ? 8 : 20 }}
            onKeyDown={e => e.key === 'Enter' && submit()} />

          {error && <div style={{ fontSize:12, color:'var(--rose)', marginBottom:14, padding:'8px 12px', background:'rgba(255,77,119,0.08)', borderRadius:'var(--r-sm)', border:'1px solid rgba(255,77,119,0.2)' }}>{error}</div>}

          <Btn variant="primary" size="lg" onClick={submit} disabled={loading} style={{ width:'100%', justifyContent:'center' }}>
            {loading ? <span style={{ animation:'pulse 1s infinite' }}>Please wait…</span> : mode==='login' ? 'Sign In →' : 'Create Account →'}
          </Btn>

          <div style={{ textAlign:'center', marginTop:20, fontSize:13, color:'var(--muted2)' }}>
            {mode==='login' ? "Don't have an account? " : 'Already have an account? '}
            <span onClick={() => { setMode(mode==='login'?'register':'login'); setError(''); }}
              style={{ color:'var(--indigo2)', cursor:'pointer', fontWeight:700 }}>
              {mode==='login'?'Sign up':'Sign in'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
