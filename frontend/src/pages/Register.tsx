import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot, User, Lock, Mail, Loader2, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { toast } from '../components/Toast';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const { register, isLoading, error } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({ username, email, password });
      toast.success('Account created!', 'Pending admin approval before you can log in.');
      setDone(true);
    } catch (err: any) {
      toast.error('Registration failed', err?.response?.data?.detail || 'Please try again');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px 12px 40px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    color: '#e6edf3',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  };

  if (done) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1117' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: '#161b22',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20,
            padding: '48px 40px',
            textAlign: 'center',
            maxWidth: 400,
            width: '90%',
          }}
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
            <CheckCircle size={64} style={{ color: '#34d399', margin: '0 auto 20px' }} />
          </motion.div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e6edf3', margin: '0 0 12px' }}>Registration Successful!</h2>
          <p style={{ fontSize: 14, color: 'rgba(230,237,243,0.5)', lineHeight: 1.6, margin: '0 0 28px' }}>
            Your account is pending admin approval. You'll be able to log in once approved.
          </p>
          <Link
            to="/login"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              borderRadius: 12, color: 'white', textDecoration: 'none',
              fontSize: 14, fontWeight: 600,
              boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
            }}
          >
            Go to Login <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', overflow: 'hidden' }}>
      {/* Left branding */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #1c2333 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 48, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '15%', left: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '15%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} style={{ textAlign: 'center', zIndex: 1 }}>
          <div style={{
            width: 80, height: 80,
            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
            borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', boxShadow: '0 0 40px rgba(139,92,246,0.4)',
          }}>
            <Bot size={40} color="white" />
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#e6edf3', margin: '0 0 12px', letterSpacing: '-0.5px' }}>Join AI Chat</h1>
          <p style={{ fontSize: 16, color: 'rgba(230,237,243,0.5)', maxWidth: 280, lineHeight: 1.6 }}>
            Create your account and get access to powerful AI conversations.
          </p>
          <div style={{ marginTop: 40, padding: '20px 24px', background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', maxWidth: 280 }}>
            <p style={{ fontSize: 12, color: 'rgba(230,237,243,0.4)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>Note</p>
            <p style={{ fontSize: 13, color: 'rgba(230,237,243,0.6)', margin: 0, lineHeight: 1.6 }}>
              New accounts require admin approval before you can start chatting.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right form */}
      <div style={{
        width: 480, background: '#161b22',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '48px 40px', borderLeft: '1px solid rgba(255,255,255,0.06)',
      }}>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} style={{ width: '100%', maxWidth: 360 }}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: '#e6edf3', margin: '0 0 8px' }}>Create account</h2>
            <p style={{ fontSize: 14, color: 'rgba(230,237,243,0.45)', margin: 0 }}>Fill in your details to get started</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{
              padding: '12px 16px', background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12,
              color: '#f87171', fontSize: 13, marginBottom: 20,
            }}>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Username', icon: <User size={16} />, type: 'text', value: username, onChange: (v: string) => setUsername(v), placeholder: 'Choose a username' },
              { label: 'Email Address', icon: <Mail size={16} />, type: 'email', value: email, onChange: (v: string) => setEmail(v), placeholder: 'your@email.com' },
              { label: 'Password', icon: <Lock size={16} />, type: 'password', value: password, onChange: (v: string) => setPassword(v), placeholder: 'Create a strong password' },
            ].map(field => (
              <div key={field.label}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'rgba(230,237,243,0.7)', marginBottom: 8 }}>{field.label}</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(230,237,243,0.3)', display: 'flex' }}>
                    {field.icon}
                  </span>
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={e => field.onChange(e.target.value)}
                    placeholder={field.placeholder}
                    required
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
              </div>
            ))}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%', padding: '13px',
                background: isLoading ? 'rgba(139,92,246,0.5)' : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                border: 'none', borderRadius: 12, color: 'white',
                fontSize: 15, fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: 4, boxShadow: '0 4px 20px rgba(139,92,246,0.3)',
              }}
            >
              {isLoading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <><Sparkles size={16} />Create Account<ArrowRight size={16} /></>}
            </motion.button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(230,237,243,0.4)', marginTop: 24 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
          </p>
        </motion.div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(230,237,243,0.25); }
      `}</style>
    </div>
  );
}
