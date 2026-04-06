import { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { Plus, MessageSquare, Trash2, LogOut, Settings, ChevronLeft, ChevronRight, Bot, Pencil, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from './Toast';
import ProfileModal from './ProfileModal';

export default function Sidebar() {
  const { chats, fetchChats, currentChatId, setCurrentChat, createChat, deleteChat, renameChat } = useChatStore();
  const { logout, role, user, theme, setTheme } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const renameRef = useRef<HTMLInputElement>(null);

  const isDark = theme === 'dark';
  const sidebarBg = isDark ? '#0d1117' : '#f0f2f5';
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const textC = isDark ? '#e6edf3' : '#1f2328';
  const mutedC = isDark ? 'rgba(230,237,243,0.5)' : 'rgba(31,35,40,0.5)';
  const hoverBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const activeBg = isDark ? 'linear-gradient(135deg,rgba(59,130,246,0.18),rgba(139,92,246,0.12))' : 'linear-gradient(135deg,rgba(59,130,246,0.12),rgba(139,92,246,0.08))';
  const activeBorder = isDark ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.3)';
  const themeAccent = isDark ? '#60a5fa' : '#f59e0b';

  useEffect(() => { fetchChats(); }, []);

  useEffect(() => {
    if (renamingId && renameRef.current) renameRef.current.focus();
  }, [renamingId]);

  const handleNewChat = async () => {
    try {
      const id = await createChat();
      setCurrentChat(id);
      toast.success('New chat created');
    } catch { toast.error('Failed to create chat'); }
  };

  const startRename = (e: React.MouseEvent, chat: { id: number; title: string }) => {
    e.stopPropagation();
    setRenamingId(chat.id);
    setRenameVal(chat.title);
  };

  const commitRename = async (chatId: number) => {
    if (renameVal.trim()) {
      try {
        await renameChat(chatId, renameVal.trim());
        toast.success('Chat renamed');
      } catch { toast.error('Failed to rename'); }
    }
    setRenamingId(null);
  };

  const initials = (user?.full_name || user?.username || '?').slice(0, 2).toUpperCase();
  const W = collapsed ? 60 : 256;

  return (
    <>
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      <motion.div
        animate={{ width: W }} transition={{ duration: 0.22, ease: 'easeInOut' }}
        style={{ width: W, minWidth: W, height: '100vh', background: sidebarBg, borderRight: `1px solid ${borderC}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}
      >
        {/* ── Top: collapse toggle + logo ── */}
        <div style={{ padding: collapsed ? '12px 10px' : '12px 14px', borderBottom: `1px solid ${borderC}`, display: 'flex', alignItems: 'center', gap: 8, justifyContent: collapsed ? 'center' : 'space-between' }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(59,130,246,0.3)', flexShrink: 0 }}>
                <Bot size={16} color="white" />
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: textC, whiteSpace: 'nowrap' }}>AI Chat</span>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: mutedC, display: 'flex', padding: 5, borderRadius: 7, transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = textC; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = mutedC; }}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* ── New Chat ── */}
        <div style={{ padding: collapsed ? '10px 8px' : '10px 10px' }}>
          <button onClick={handleNewChat} style={{
            width: '100%', padding: collapsed ? '9px' : '9px 12px',
            background: 'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(139,92,246,0.15))',
            border: '1px solid rgba(59,130,246,0.25)', borderRadius: 9,
            color: '#93c5fd', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 7,
            transition: 'all .15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg,rgba(59,130,246,0.25),rgba(139,92,246,0.25))'}
            onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(139,92,246,0.15))'}
          >
            <Plus size={15} />
            {!collapsed && <span>New Chat</span>}
          </button>
        </div>

        {/* ── Chat list ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2px 6px' }}>
          {!collapsed && chats.length === 0 && (
            <div style={{ textAlign: 'center', padding: '28px 12px', color: mutedC }}>
              <MessageSquare size={26} style={{ margin: '0 auto 8px', opacity: 0.35 }} />
              <p style={{ fontSize: 12 }}>No chats yet</p>
              <p style={{ fontSize: 11, opacity: 0.7, marginTop: 3 }}>Start a new conversation</p>
            </div>
          )}
          <AnimatePresence>
            {chats.map(chat => (
              <motion.div key={chat.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                onClick={() => renamingId !== chat.id && setCurrentChat(chat.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: collapsed ? '9px 6px' : '8px 8px',
                  borderRadius: 8, cursor: 'pointer', marginBottom: 1,
                  background: currentChatId === chat.id ? activeBg : 'transparent',
                  border: `1px solid ${currentChatId === chat.id ? activeBorder : 'transparent'}`,
                  transition: 'all .12s', justifyContent: collapsed ? 'center' : 'flex-start', position: 'relative',
                }}
                onMouseEnter={e => {
                  if (currentChatId !== chat.id) e.currentTarget.style.background = hoverBg;
                  e.currentTarget.querySelectorAll<HTMLElement>('.chat-action').forEach(b => b.style.opacity = '1');
                }}
                onMouseLeave={e => {
                  if (currentChatId !== chat.id) e.currentTarget.style.background = 'transparent';
                  e.currentTarget.querySelectorAll<HTMLElement>('.chat-action').forEach(b => b.style.opacity = '0');
                }}
              >
                <MessageSquare size={14} style={{ flexShrink: 0, color: currentChatId === chat.id ? '#60a5fa' : mutedC }} />
                {!collapsed && (
                  renamingId === chat.id ? (
                    <input ref={renameRef} value={renameVal} onChange={e => setRenameVal(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') commitRename(chat.id); if (e.key === 'Escape') setRenamingId(null); }}
                      onBlur={() => commitRename(chat.id)}
                      onClick={e => e.stopPropagation()}
                      style={{ flex: 1, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: 6, padding: '2px 6px', color: textC, fontSize: 12, outline: 'none' }}
                    />
                  ) : (
                    <span style={{ flex: 1, fontSize: 12, color: currentChatId === chat.id ? textC : mutedC, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {chat.title}
                    </span>
                  )
                )}
                {!collapsed && renamingId !== chat.id && (
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    <button className="chat-action" onClick={e => startRename(e, chat)} style={{ opacity: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 3, borderRadius: 5, color: mutedC, display: 'flex', transition: 'all .12s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#60a5fa'; e.currentTarget.style.background = isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = mutedC; e.currentTarget.style.background = 'none'; }}>
                      <Pencil size={11} />
                    </button>
                    <button className="chat-action" onClick={e => { e.stopPropagation(); deleteChat(chat.id); toast.info('Chat deleted'); }} style={{ opacity: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 3, borderRadius: 5, color: mutedC, display: 'flex', transition: 'all .12s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = mutedC; e.currentTarget.style.background = 'none'; }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ── Bottom: admin + profile + logout ── */}
        <div style={{ padding: collapsed ? '10px 8px' : '10px', borderTop: `1px solid ${borderC}`, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {role === 'admin' && (
            <a href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: collapsed ? '8px 6px' : '8px 10px', borderRadius: 8, textDecoration: 'none', color: mutedC, fontSize: 12, justifyContent: collapsed ? 'center' : 'flex-start', transition: 'all .12s' }}
              onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = textC; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = mutedC; }}>
              <Settings size={14} style={{ flexShrink: 0 }} />
              {!collapsed && <span>Admin Panel</span>}
            </a>
          )}

          {/* Profile button */}
          <button onClick={() => setShowProfile(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: collapsed ? '8px 6px' : '8px 10px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', width: '100%', justifyContent: collapsed ? 'center' : 'flex-start', transition: 'all .12s' }}
            onMouseEnter={e => e.currentTarget.style.background = hoverBg}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0 }}>
              {initials}
            </div>
            {!collapsed && (
              <div style={{ textAlign: 'left', minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: textC, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name || user?.username || 'Profile'}</div>
                <div style={{ fontSize: 10, color: mutedC, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              </div>
            )}
          </button>

          <button onClick={() => setTheme(isDark ? 'light' : 'dark')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: collapsed ? '8px 6px' : '8px 10px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', width: '100%', justifyContent: collapsed ? 'center' : 'flex-start', transition: 'all .12s', color: mutedC }}
            onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = textC; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = mutedC; }}>
            {isDark ? <Moon size={14} style={{ flexShrink: 0, color: themeAccent }} /> : <Sun size={14} style={{ flexShrink: 0, color: themeAccent }} />}
            {!collapsed && (
              <div style={{ textAlign: 'left', minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: textC }}>{isDark ? 'Dark Mode' : 'Light Mode'}</div>
                <div style={{ fontSize: 10, color: mutedC }}>{isDark ? 'Switch to light theme' : 'Switch to dark theme'}</div>
              </div>
            )}
          </button>

          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: collapsed ? '8px 6px' : '8px 10px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: mutedC, fontSize: 12, width: '100%', justifyContent: collapsed ? 'center' : 'flex-start', transition: 'all .12s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = mutedC; }}>
            <LogOut size={14} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </motion.div>
    </>
  );
}
