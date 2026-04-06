import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export interface ToastItem {
  id: string; type: ToastType; title: string; message?: string; duration?: number;
}

const listeners: ((t: ToastItem) => void)[] = [];
export const toast = {
  show(item: Omit<ToastItem, 'id'>) {
    const t: ToastItem = { id: Math.random().toString(36).slice(2), duration: 3500, ...item };
    listeners.forEach(fn => fn(t));
  },
  success(title: string, message?: string) { this.show({ type: 'success', title, message }); },
  error(title: string, message?: string)   { this.show({ type: 'error',   title, message, duration: 5000 }); },
  warning(title: string, message?: string) { this.show({ type: 'warning', title, message }); },
  info(title: string, message?: string)    { this.show({ type: 'info',    title, message }); },
};

const cfg = {
  success: { icon: CheckCircle2, color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', bar: '#10b981' },
  error:   { icon: XCircle,      color: '#f87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  bar: '#ef4444' },
  warning: { icon: AlertTriangle, color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', bar: '#f59e0b' },
  info:    { icon: Info,          color: '#60a5fa', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', bar: '#3b82f6' },
};

function ToastCard({ item, onRemove }: { item: ToastItem; onRemove: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);
  const c = cfg[item.type];
  const Icon = c.icon;

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(item.id), 260);
  }, [item.id, onRemove]);

  useEffect(() => {
    const t = setTimeout(dismiss, item.duration ?? 3500);
    return () => clearTimeout(t);
  }, [dismiss, item.duration]);

  return (
    <div onClick={dismiss} style={{
      position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '14px 16px 14px 18px',
      background: 'rgba(22,27,34,0.97)',
      backdropFilter: 'blur(16px)',
      border: `1px solid ${c.border}`,
      borderRadius: 14,
      boxShadow: '0 8px 40px rgba(0,0,0,0.45)',
      minWidth: 300, maxWidth: 420,
      overflow: 'hidden', cursor: 'pointer',
      animation: exiting ? 'toast-out .26s ease forwards' : 'toast-in .28s ease forwards',
    }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: c.bar, borderRadius: '14px 0 0 14px' }} />
      <div style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 8, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color={c.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3', marginBottom: item.message ? 3 : 0 }}>{item.title}</div>
        {item.message && <div style={{ fontSize: 12, color: 'rgba(230,237,243,0.55)', lineHeight: 1.5 }}>{item.message}</div>}
      </div>
      <button onClick={e => { e.stopPropagation(); dismiss(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(230,237,243,0.35)', padding: 2, display: 'flex', alignItems: 'center' }}>
        <X size={14} />
      </button>
      <div style={{ position: 'absolute', bottom: 0, left: 0, height: 2, background: c.bar, opacity: 0.4, animation: `progress-shrink ${item.duration ?? 3500}ms linear forwards` }} />
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  useEffect(() => {
    const h = (t: ToastItem) => setToasts(p => [...p, t]);
    listeners.push(h);
    return () => { const i = listeners.indexOf(h); if (i > -1) listeners.splice(i, 1); };
  }, []);
  const remove = useCallback((id: string) => setToasts(p => p.filter(t => t.id !== id)), []);
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10,
      pointerEvents: 'none', alignItems: 'center',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'all' }}>
          <ToastCard item={t} onRemove={remove} />
        </div>
      ))}
    </div>
  );
}
