import { useEffect, useState } from 'react';
import api from '../lib/api';
import { User, Check, X, Shield, Key, Save, Loader2, Home, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Phone, FileText, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '../components/Toast';

interface UserData { id: number; username: string; email: string; status: string; role: string; full_name?: string; mobile?: string; bio?: string; created_at?: string; }
interface LLMConfigData {
  id: number;
  provider: string;
  model: string;
  has_api_key: boolean;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  updated_at: string;
};

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  approved: { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.25)' },
  pending:  { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
  rejected: { bg: 'rgba(239,68,68,0.12)',  text: '#f87171', border: 'rgba(239,68,68,0.25)' },
};

function UserCard({ u, onApprove }: { u: UserData; onApprove: (id: number, status: string, role: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [roleOverride, setRoleOverride] = useState(u.role);
  const sc = statusColors[u.status] || statusColors.pending;
  const initials = (u.full_name || u.username).slice(0, 2).toUpperCase();

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      style={{ borderRadius: 12, marginBottom: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '11px 14px', gap: 10 }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3' }}>{u.full_name || u.username}</div>
          <div style={{ fontSize: 11, color: 'rgba(230,237,243,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
          <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
            <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, textTransform: 'uppercase', fontWeight: 700 }}>{u.status}</span>
            <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)', textTransform: 'uppercase', fontWeight: 700 }}>{u.role}</span>
          </div>
        </div>
        {/* Role selector */}
        <select value={roleOverride} onChange={e => setRoleOverride(e.target.value)} onClick={e => e.stopPropagation()}
          style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: '#e6edf3', fontSize: 11, outline: 'none', cursor: 'pointer' }}>
          <option value="user" style={{ background: '#161b22' }}>User</option>
          <option value="admin" style={{ background: '#161b22' }}>Admin</option>
        </select>
        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 5 }}>
          {u.status !== 'approved' && (
            <button onClick={() => onApprove(u.id, 'approved', roleOverride)} title="Approve"
              style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.12)'; e.currentTarget.style.color = '#34d399'; }}>
              <Check size={13} />
            </button>
          )}
          {u.status !== 'rejected' && (
            <button onClick={() => onApprove(u.id, 'rejected', u.role)} title="Reject"
              style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#f87171'; }}>
              <X size={13} />
            </button>
          )}
          <button onClick={() => setExpanded(!expanded)} title="View profile"
            style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(230,237,243,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Expanded profile */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { icon: <User size={11} />, label: 'Username', value: u.username },
              { icon: <Phone size={11} />, label: 'Mobile', value: u.mobile || '—' },
              { icon: <FileText size={11} />, label: 'Full Name', value: u.full_name || '—' },
              { icon: <Calendar size={11} />, label: 'Joined', value: u.created_at ? new Date(u.created_at).toLocaleDateString() : '—' },
            ].map(f => (
              <div key={f.label} style={{ padding: '7px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(230,237,243,0.4)', marginBottom: 3 }}>
                  {f.icon}<span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</span>
                </div>
                <div style={{ fontSize: 12, color: '#e6edf3' }}>{f.value}</div>
              </div>
            ))}
            {u.bio && (
              <div style={{ gridColumn: '1/-1', padding: '7px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(230,237,243,0.4)', marginBottom: 3 }}>
                  <FileText size={11} /><span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>Bio</span>
                </div>
                <div style={{ fontSize: 12, color: '#e6edf3', lineHeight: 1.5 }}>{u.bio}</div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AdminPanel() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [activeConfig, setActiveConfig] = useState<LLMConfigData | null>(null);
  const [llm, setLlm] = useState({ provider: 'openrouter', model: 'google/gemini-2.0-flash-001', api_key: '', temperature: 0.7, max_tokens: 2000 });
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try { const r = await api.get('/admin/users'); setUsers(r.data); }
    catch { toast.error('Failed to load users'); }
    finally { setLoadingUsers(false); }
  };

  const fetchLLMConfig = async () => {
    setLoadingConfig(true);
    try {
      const response = await api.get('/admin/llm-config');
      const active = response.data.find((config: LLMConfigData) => config.is_active) || response.data[0] || null;
      setActiveConfig(active);
      if (active) {
        setLlm({
          provider: active.provider,
          model: active.model,
          api_key: '',
          temperature: active.temperature,
          max_tokens: active.max_tokens,
        });
      }
    } catch {
      toast.error('Failed to load AI configuration');
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLLMConfig();
  }, []);

  const handleApprove = async (id: number, status: string, role: string) => {
    try {
      await api.post('/admin/users/approve', { user_id: id, status, role });
      toast.success(`User ${status}`, `Role set to ${role}`);
      fetchUsers();
    } catch { toast.error('Update failed'); }
  };

  const handleSaveLLM = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      await api.post('/admin/llm-config', llm);
      await fetchLLMConfig();
      setLlm((current) => ({ ...current, api_key: '' }));
      setSaveStatus('saved');
      toast.success('Configuration saved');
    } catch {
      setSaveStatus('error');
      toast.error('Save failed');
    } finally { setTimeout(() => setSaveStatus('idle'), 2500); }
  };

  const inputStyle = { width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#e6edf3', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const };
  const apiKeyStatus = activeConfig?.has_api_key ? 'Stored in database' : 'No API key saved';

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#0d1117', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', height: 56, flexShrink: 0, background: '#161b22', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={16} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3' }}>Admin Control Center</div>
            <div style={{ fontSize: 11, color: 'rgba(230,237,243,0.4)' }}>Manage users and AI configuration</div>
          </div>
        </div>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, color: 'rgba(230,237,243,0.7)', fontSize: 12, cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
          <Home size={14} /> Back to Chat
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Users */}
          <div style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <User size={15} style={{ color: '#60a5fa' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3' }}>User Management</span>
                <span style={{ padding: '1px 7px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 99, fontSize: 10, color: '#60a5fa' }}>{users.length}</span>
              </div>
              {loadingUsers && <Loader2 size={14} style={{ color: 'rgba(230,237,243,0.3)', animation: 'spin 1s linear infinite' }} />}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              {users.length === 0 && !loadingUsers && (
                <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(230,237,243,0.3)' }}>
                  <User size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                  <p style={{ fontSize: 12 }}>No users found</p>
                </div>
              )}
              {users.map(u => <UserCard key={u.id} u={u} onApprove={handleApprove} />)}
            </div>
          </div>

          {/* LLM Config */}
          <div style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Key size={15} style={{ color: '#a78bfa' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3' }}>LLM Configuration</span>
              </div>
              {loadingConfig && <Loader2 size={14} style={{ color: 'rgba(230,237,243,0.3)', animation: 'spin 1s linear infinite' }} />}
            </div>
            <form onSubmit={handleSaveLLM} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
              {[
                { label: 'Provider', type: 'select', key: 'provider', options: ['openrouter', 'openai', 'anthropic', 'gemini'] },
                { label: 'Model ID', type: 'text', key: 'model', placeholder: 'e.g. google/gemini-2.0-flash-001' },
                { label: 'API Key', type: 'password', key: 'api_key', placeholder: activeConfig?.has_api_key ? 'Leave blank to keep current key' : 'sk-...' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'rgba(230,237,243,0.55)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</label>
                  {f.type === 'select' ? (
                    <select value={(llm as any)[f.key]} onChange={e => setLlm({ ...llm, [f.key]: e.target.value })} style={inputStyle}>
                      {f.options!.map(o => <option key={o} value={o} style={{ background: '#161b22' }}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={f.type} value={(llm as any)[f.key]} onChange={e => setLlm({ ...llm, [f.key]: e.target.value })} placeholder={f.placeholder} style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                  )}
                </div>
              ))}
              <div style={{ padding: '12px 13px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(230,237,243,0.55)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>API Key Status</div>
                  <div style={{ fontSize: 12, color: activeConfig?.has_api_key ? '#34d399' : '#fbbf24' }}>{apiKeyStatus}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(230,237,243,0.55)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Save Behavior</div>
                  <div style={{ fontSize: 12, color: '#e6edf3' }}>
                    {activeConfig?.has_api_key ? 'Blank key keeps the current saved value' : 'Enter a key to enable live provider calls'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(230,237,243,0.55)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Active Provider</div>
                  <div style={{ fontSize: 12, color: '#e6edf3' }}>{activeConfig?.provider || llm.provider}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(230,237,243,0.55)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Last Updated</div>
                  <div style={{ fontSize: 12, color: '#e6edf3' }}>{activeConfig?.updated_at ? new Date(activeConfig.updated_at).toLocaleString() : 'Not set'}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[{ label: 'Temperature', key: 'temperature', step: '0.1', min: '0', max: '2' }, { label: 'Max Tokens', key: 'max_tokens', step: '100', min: '100', max: '32000' }].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'rgba(230,237,243,0.55)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</label>
                    <input type="number" step={f.step} min={f.min} max={f.max} value={(llm as any)[f.key]}
                      onChange={e => setLlm({ ...llm, [f.key]: f.key === 'temperature' ? parseFloat(e.target.value) : parseInt(e.target.value) })}
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                  </div>
                ))}
              </div>
              <button type="submit" disabled={saveStatus === 'saving'} style={{
                padding: '11px', borderRadius: 11, border: 'none', cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
                background: saveStatus === 'saved' ? 'linear-gradient(135deg,#10b981,#059669)' : saveStatus === 'error' ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#3b82f6,#6366f1)',
                color: 'white', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 'auto',
              }}>
                {saveStatus === 'saving' ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />Saving...</>
                  : saveStatus === 'saved' ? <><CheckCircle2 size={15} />Saved!</>
                  : saveStatus === 'error' ? <><AlertCircle size={15} />Failed</>
                  : <><Save size={15} />Save Configuration</>}
              </button>
            </form>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} input::placeholder,textarea::placeholder{color:rgba(230,237,243,0.25)} select option{background:#161b22}`}</style>
    </div>
  );
}
