import { useState } from 'react';
import { X, User, Mail, Phone, FileText, Save, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from './Toast';

interface Props { onClose: () => void; }

export default function ProfileModal({ onClose }: Props) {
  const { user, updateProfile, theme } = useAuthStore();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);

  const isDark = theme === 'dark';
  const bg = isDark ? '#161b22' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const text = isDark ? '#e6edf3' : '#1f2328';
  const muted = isDark ? 'rgba(230,237,243,0.5)' : 'rgba(31,35,40,0.55)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#f6f8fa';
  const inputBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)';

  const initials = (user?.full_name || user?.username || '?').slice(0, 2).toUpperCase();

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ full_name: fullName, mobile, bio });
      toast.success('Profile updated');
      onClose();
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    background: inputBg, border: `1px solid ${inputBorder}`,
    borderRadius: 10, color: text, fontSize: 13, outline: 'none',
    boxSizing: 'border-box' as const, transition: 'border-color .2s',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: bg, border: `1px solid ${border}`,
        borderRadius: 20, width: 420, maxWidth: '95vw',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        animation: 'modal-in .22s ease',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: text }}>My Profile</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted, display: 'flex', padding: 4, borderRadius: 6 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Avatar + info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700, color: 'white',
              boxShadow: '0 4px 16px rgba(59,130,246,0.35)',
            }}>{initials}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: text }}>{user?.full_name || user?.username}</div>
              <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>{user?.email}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)', fontWeight: 600, textTransform: 'uppercase' }}>{user?.role}</span>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)', fontWeight: 600, textTransform: 'uppercase' }}>{user?.status}</span>
              </div>
            </div>
          </div>

          {/* Read-only fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {[
              { icon: <User size={13} />, label: 'Username', value: user?.username },
              { icon: <Mail size={13} />, label: 'Email', value: user?.email },
            ].map(f => (
              <div key={f.label} style={{ padding: '8px 12px', background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: muted, marginBottom: 3 }}>
                  {f.icon}<span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</span>
                </div>
                <div style={{ fontSize: 13, color: text, fontWeight: 500 }}>{f.value || '—'}</div>
              </div>
            ))}
          </div>

          {/* Editable fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                <User size={11} /> Full Name
              </label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
                onBlur={e => e.target.style.borderColor = inputBorder} />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                <Phone size={11} /> Mobile
              </label>
              <input value={mobile} onChange={e => setMobile(e.target.value)} placeholder="+1 234 567 8900" style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
                onBlur={e => e.target.style.borderColor = inputBorder} />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                <FileText size={11} /> Bio
              </label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={2}
                style={{ ...inputStyle, resize: 'none' }}
                onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
                onBlur={e => e.target.style.borderColor = inputBorder} />
            </div>
          </div>

          {/* Save */}
          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', marginTop: 16, padding: '11px',
            background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
            border: 'none', borderRadius: 12, color: 'white',
            fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: saving ? 0.7 : 1,
          }}>
            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
