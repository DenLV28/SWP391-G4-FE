import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import type { User } from '../data/mockData';
import { fetchChatMessages, sendChatMessage, subscribeToChatEvents, type ChatMessage } from '../services/chatService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

const roleLabel = (role: string) => (role === 'Parking Manager' ? 'Quản lý' : 'Nhân viên');

export default function StaffManagerChat({ isOpen, onClose, currentUser }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    fetchChatMessages().then((msgs) => { if (active) setMessages(msgs); }).catch(() => {});
    const unsubscribe = subscribeToChatEvents((msg) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    });
    return () => { active = false; unsubscribe(); };
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft('');
    try {
      const sent = await sendChatMessage({
        senderId: currentUser.id,
        senderName: currentUser.fullName,
        senderRole: currentUser.role,
        message: text,
      });
      setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
    } catch {
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex h-[560px] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-blue-600 px-5 py-4">
          <div className="flex items-center gap-2.5 text-white">
            <MessageCircle className="h-5 w-5" />
            <div>
              <h3 className="text-sm font-bold">Trao đổi Nhân viên · Quản lý</h3>
              <p className="text-[11px] text-blue-100">Kênh liên hệ trực tiếp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Đóng"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-4 py-4">
          {messages.length === 0 && (
            <p className="mt-8 text-center text-xs text-slate-400">Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện.</p>
          )}
          {messages.map((m) => {
            const isMine = m.senderId === currentUser.id;
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                  isMine ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-100'
                }`}>
                  {!isMine && (
                    <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-600">
                      {m.senderName || roleLabel(m.senderRole)}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.message}</p>
                  <p className={`mt-1 text-[9px] ${isMine ? 'text-blue-100' : 'text-slate-400'}`}>{m.createdAt}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Nhập tin nhắn..."
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-300"
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-40"
            aria-label="Gửi"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
