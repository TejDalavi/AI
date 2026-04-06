import { useState, useRef, useEffect, useCallback } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { Bot, Sparkles, MessageCircle, ArrowUp, Image, Mic, MicOff, X, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from './Toast';

const SUGGESTIONS = [
  { icon: '💡', title: 'Ask anything', prompt: 'What can you help me with?' },
  { icon: '💻', title: 'Write code', prompt: 'Write a Python function to sort a list' },
  { icon: '✍️', title: 'Create content', prompt: 'Write a professional email template' },
  { icon: '🔍', title: 'Analyze data', prompt: 'Explain how to analyze CSV data' },
];

export default function ChatWindow() {
  const { currentChatId, messages, sendMessage, isSending, createChat, setCurrentChat } = useChatStore();
  const { theme, user } = useAuthStore();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [hoveredCodeId, setHoveredCodeId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const isDark = theme === 'dark';
  const bgMain = isDark ? '#161b22' : '#ffffff';
  const textC = isDark ? '#e6edf3' : '#1f2328';
  const mutedC = isDark ? 'rgba(230,237,243,0.45)' : 'rgba(31,35,40,0.5)';
  const faintC = isDark ? 'rgba(230,237,243,0.25)' : 'rgba(31,35,40,0.3)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#f6f8fa';
  const inputBorder = isDark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.14)';
  const msgAiBg = isDark ? 'rgba(255,255,255,0.05)' : '#f0f2f5';
  const msgAiBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';

  const copyButtonBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const copyButtonBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  const codeCopyBg = isDark ? 'rgba(13,17,23,0.78)' : 'rgba(255,255,255,0.92)';
  const codeCopyBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isSending) { setIsTyping(true); }
    else { const t = setTimeout(() => setIsTyping(false), 500); return () => clearTimeout(t); }
  }, [isSending]);

  useEffect(() => {
    if (currentChatId && textareaRef.current) textareaRef.current.focus();
  }, [currentChatId]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, [input]);

  const doSend = useCallback(async (overrideContent?: string) => {
    const content = (overrideContent ?? input).trim();
    if (!content && !imageFile) return;
    if (isSending) return;

    let chatId = currentChatId;
    // Auto-create chat if none selected
    if (!chatId) {
      try {
        chatId = await createChat();
        setCurrentChat(chatId);
      } catch {
        toast.error('Could not create chat');
        return;
      }
    }

    const msgContent = imageFile
      ? `${content}\n\n[Image attached: ${imageFile.name}]`
      : content;

    setInput('');
    setImageFile(null);
    setImagePreview(null);

    try {
      await sendMessage(chatId, msgContent);
    } catch (err: any) {
      toast.error('Message failed', err?.response?.data?.detail || 'Could not send message');
    }
  }, [input, imageFile, isSending, currentChatId, createChat, setCurrentChat, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.warning('Please select an image file'); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const toggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        // Voice input: transcription would require a backend endpoint.
        // For now, notify user.
        toast.info('Voice recorded', 'Voice-to-text requires a transcription API. Attach your backend endpoint to /api/transcribe.');
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      toast.info('Recording...', 'Click the mic again to stop');
    } catch {
      toast.error('Microphone access denied', 'Please allow microphone access in your browser');
    }
  };

  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand('copy');
        document.body.removeChild(textarea);
        return copied;
      } catch {
        return false;
      }
    }
  }, []);

  const handleCopyMessage = useCallback(async (messageId: number, content: string) => {
    const copied = await copyText(content);
    if (!copied) {
      toast.error('Copy failed', 'Could not copy the generated content');
      return;
    }
    setCopiedMessageId(messageId);
    window.setTimeout(() => {
      setCopiedMessageId(current => current === messageId ? null : current);
    }, 1800);
  }, [copyText]);

  const handleCopyCode = useCallback(async (codeId: string, content: string) => {
    const copied = await copyText(content);
    if (!copied) {
      toast.error('Copy failed', 'Could not copy the code block');
      return;
    }
    setCopiedCodeId(codeId);
    window.setTimeout(() => {
      setCopiedCodeId(current => current === codeId ? null : current);
    }, 1800);
  }, [copyText]);

  const initials = (user?.full_name || user?.username || '?').slice(0, 2).toUpperCase();

  // ── Empty / no messages state ──
  const showSuggestions = !messages.length;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: bgMain }}>

      {/* ── Messages area ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: showSuggestions ? 0 : '20px 0' }}>
        {showSuggestions ? (
          /* Welcome / suggestion cards */
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              style={{ textAlign: 'center', maxWidth: 520, width: '100%' }}>
              <motion.div animate={{ rotate: [0, 4, -4, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: 68, height: 68, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: '0 0 32px rgba(59,130,246,0.25)' }}>
                <MessageCircle size={30} color="white" />
              </motion.div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: textC, margin: '0 0 8px', letterSpacing: '-0.3px' }}>
                {currentChatId ? 'Start the conversation' : 'AI Chat Assistant'}
              </h1>
              <p style={{ fontSize: 14, color: mutedC, margin: '0 0 28px', lineHeight: 1.6 }}>
                {currentChatId ? 'Send your first message below.' : 'Type a message or pick a suggestion to get started.'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {SUGGESTIONS.map(s => (
                  <button key={s.title} onClick={() => doSend(s.prompt)}
                    style={{ padding: '14px', background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, textAlign: 'left', cursor: 'pointer', transition: 'all .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.06)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.25)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = cardBg; e.currentTarget.style.borderColor = cardBorder; }}>
                    <div style={{ fontSize: 18, marginBottom: 5 }}>{s.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: textC, marginBottom: 3 }}>{s.title}</div>
                    <div style={{ fontSize: 11, color: mutedC, lineHeight: 1.4 }}>{s.prompt}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          /* Messages */
          <div style={{ maxWidth: '85%', margin: '0 auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}
                  style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-start' }}>
                  {/* Avatar */}
                  <div style={{ width: 30, height: 30, flexShrink: 0, borderRadius: '50%', background: msg.role === 'user' ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', boxShadow: msg.role === 'user' ? '0 2px 10px rgba(59,130,246,0.3)' : '0 2px 10px rgba(16,185,129,0.3)' }}>
                    {msg.role === 'user' ? initials : <Bot size={14} color="white" />}
                  </div>
                  {/* Bubble */}
                  <div
                    style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 6 }}
                    onMouseEnter={() => { if (msg.role !== 'user') setHoveredMessageId(msg.id); }}
                    onMouseLeave={() => { if (msg.role !== 'user') setHoveredMessageId(current => current === msg.id ? null : current); }}
                  >
                    <div style={{ maxWidth: '100%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px', background: msg.role === 'user' ? 'linear-gradient(135deg,#2563eb,#4f46e5)' : msgAiBg, border: msg.role === 'user' ? '1px solid rgba(59,130,246,0.3)' : `1px solid ${msgAiBorder}`, color: msg.role === 'user' ? 'white' : textC, fontSize: 13.5, lineHeight: 1.65, boxShadow: msg.role === 'user' ? '0 3px 16px rgba(37,99,235,0.22)' : '0 2px 8px rgba(0,0,0,0.1)' }}>
                      <ReactMarkdown components={{
                        code({ className, children }) {
                          const rawCode = String(children).replace(/\n$/, '');
                          const codeKey = `${msg.id}:${className || 'inline'}:${rawCode}`;
                          const showCodeCopy = hoveredCodeId === codeKey || copiedCodeId === codeKey;
                        const match = /language-(\w+)/.exec(className || '');
                        return match ? (
                          <div
                            style={{ position: 'relative', margin: '6px 0' }}
                            onMouseEnter={() => setHoveredCodeId(codeKey)}
                            onMouseLeave={() => setHoveredCodeId(current => current === codeKey ? null : current)}
                          >
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleCopyCode(codeKey, rawCode);
                              }}
                              style={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                zIndex: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '5px 8px',
                                borderRadius: 8,
                                border: `1px solid ${codeCopyBorder}`,
                                background: codeCopyBg,
                                color: copiedCodeId === codeKey ? '#34d399' : textC,
                                cursor: 'pointer',
                                fontSize: 11,
                                fontWeight: 600,
                                opacity: showCodeCopy ? 1 : 0,
                                transition: 'opacity .15s ease, color .15s ease',
                                backdropFilter: 'blur(8px)',
                              }}
                            >
                              {copiedCodeId === codeKey ? <Check size={12} /> : <Copy size={12} />}
                              <span>{copiedCodeId === codeKey ? 'Copied' : 'Copy code'}</span>
                            </button>
                            <SyntaxHighlighter style={isDark ? vscDarkPlus : prism} language={match[1]} PreTag="div" customStyle={{ borderRadius: 8, margin: 0, fontSize: 12, paddingTop: 40 }}>
                              {rawCode}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code style={{ padding: '1px 5px', borderRadius: 4, fontSize: 12, background: msg.role === 'user' ? 'rgba(255,255,255,0.15)' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', fontFamily: 'monospace' }}>{children}</code>
                        );
                      },
                      p: ({ children }) => <p style={{ margin: '0 0 6px' }}>{children}</p>,
                      ul: ({ children }) => <ul style={{ margin: '3px 0 6px', paddingLeft: 18 }}>{children}</ul>,
                      ol: ({ children }) => <ol style={{ margin: '3px 0 6px', paddingLeft: 18 }}>{children}</ol>,
                      li: ({ children }) => <li style={{ marginBottom: 3 }}>{children}</li>,
                      strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
                      }}>{msg.content}</ReactMarkdown>
                    </div>
                    {msg.role !== 'user' && (hoveredMessageId === msg.id || copiedMessageId === msg.id) && (
                      <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-start' }}>
                        <button
                          type="button"
                          onClick={() => void handleCopyMessage(msg.id, msg.content)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '5px 9px',
                            borderRadius: 8,
                            border: `1px solid ${copyButtonBorder}`,
                            background: copyButtonBg,
                            color: copiedMessageId === msg.id ? '#34d399' : mutedC,
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 600,
                            transition: 'color .15s ease, border-color .15s ease',
                          }}
                        >
                          {copiedMessageId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedMessageId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 30, height: 30, flexShrink: 0, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={14} color="white" />
                  </div>
                  <div style={{ padding: '12px 16px', background: msgAiBg, border: `1px solid ${msgAiBorder}`, borderRadius: '4px 16px 16px 16px', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                    <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                    <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input bar ── */}
      <div style={{ padding: '10px 16px 14px', background: bgMain, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`, flexShrink: 0 }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>

          {/* Image preview */}
          <AnimatePresence>
            {imagePreview && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ marginBottom: 8, position: 'relative', display: 'inline-block' }}>
                <img src={imagePreview} alt="attachment" style={{ height: 64, borderRadius: 8, border: `1px solid ${inputBorder}`, objectFit: 'cover' }} />
                <button onClick={() => { setImageFile(null); setImagePreview(null); }} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={10} color="white" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input box */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, background: inputBg, border: `1.5px solid ${inputBorder}`, borderRadius: 14, padding: '8px 8px 8px 12px', transition: 'border-color .2s, box-shadow .2s' }}
            onFocusCapture={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.55)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
            onBlurCapture={e => { e.currentTarget.style.borderColor = inputBorder; e.currentTarget.style.boxShadow = 'none'; }}>

            {/* Sparkle icon */}
            <Sparkles size={14} style={{ color: faintC, flexShrink: 0, marginBottom: 6 }} />

            <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={currentChatId ? 'Message AI… (Enter to send)' : 'Ask anything or pick a suggestion above…'}
              disabled={isSending} rows={1}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: textC, fontSize: 14, lineHeight: 1.6, resize: 'none', minHeight: 24, maxHeight: 160, overflowY: 'auto', fontFamily: 'inherit', padding: '2px 0', cursor: isSending ? 'not-allowed' : 'text' }}
            />

            {/* Action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {/* Image attach */}
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagePick} />
              <button onClick={() => fileInputRef.current?.click()} title="Attach image"
                style={{ width: 30, height: 30, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: imageFile ? '#60a5fa' : faintC, transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'; e.currentTarget.style.color = '#60a5fa'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = imageFile ? '#60a5fa' : faintC; }}>
                <Image size={15} />
              </button>

              {/* Voice */}
              <button onClick={toggleRecording} title={recording ? 'Stop recording' : 'Voice input'}
                style={{ width: 30, height: 30, borderRadius: 8, background: recording ? 'rgba(239,68,68,0.15)' : 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: recording ? '#f87171' : faintC, transition: 'all .15s' }}
                onMouseEnter={e => { if (!recording) { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'; e.currentTarget.style.color = '#60a5fa'; } }}
                onMouseLeave={e => { if (!recording) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = faintC; } }}>
                {recording ? <MicOff size={15} /> : <Mic size={15} />}
              </button>

              {/* Send */}
              <button onClick={() => doSend()} disabled={isSending || (!input.trim() && !imageFile)}
                style={{ width: 32, height: 32, borderRadius: 9, background: (input.trim() || imageFile) && !isSending ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', border: 'none', cursor: (input.trim() || imageFile) && !isSending ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s', boxShadow: (input.trim() || imageFile) && !isSending ? '0 2px 10px rgba(59,130,246,0.35)' : 'none' }}>
                {isSending
                  ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                  : <ArrowUp size={15} color={(input.trim() || imageFile) && !isSending ? 'white' : faintC} />}
              </button>
            </div>
          </div>

          {/* Hint */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, padding: '0 2px' }}>
            <span style={{ fontSize: 10, color: faintC }}>AI can make mistakes. Verify important info.</span>
            <span style={{ fontSize: 10, color: faintC, display: 'flex', gap: 4, alignItems: 'center' }}>
              <kbd style={{ padding: '1px 4px', background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', borderRadius: 3, border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, fontSize: 9 }}>Enter</kbd> send ·
              <kbd style={{ padding: '1px 4px', background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', borderRadius: 3, border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, fontSize: 9 }}>Shift+Enter</kbd> new line
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
