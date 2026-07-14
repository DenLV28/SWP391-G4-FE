import { buildApiUrl as buildUrl } from './apiConfig';

const headers = () => ({
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'ngrok-skip-browser-warning': '1',
});

export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
};

function toChatMessage(r: any): ChatMessage {
  return {
    id: String(r.id || r.message_id),
    senderId: String(r.senderId || r.sender_id || ''),
    senderName: r.senderName || r.sender_name || '',
    senderRole: r.senderRole || r.sender_role || '',
    message: r.message || '',
    createdAt: r.createdAt || r.created_at || '',
  };
}

export async function fetchChatMessages(): Promise<ChatMessage[]> {
  const res = await fetch(buildUrl('/api/staff-manager-messages'), { headers: headers() });
  if (!res.ok) throw new Error(`Chat API ${res.status}`);
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map(toChatMessage);
}

export async function sendChatMessage(payload: {
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
}): Promise<ChatMessage> {
  const res = await fetch(buildUrl('/api/staff-manager-messages'), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Chat API ${res.status}`);
  const data = await res.json();
  return toChatMessage(data.message ?? data);
}

/** Push-based sync so both sides see new messages instantly, without polling. */
export function subscribeToChatEvents(onMessage: (msg: ChatMessage) => void): () => void {
  let cancelled = false;
  let retryTimer: ReturnType<typeof setTimeout>;

  const connect = async () => {
    if (cancelled) return;
    try {
      const res = await fetch(buildUrl('/api/staff-manager-messages/events'), {
        headers: {
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
          'ngrok-skip-browser-warning': '1',
        },
      });
      if (!res.ok || !res.body) throw new Error('SSE failed');

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';

      while (true) {
        if (cancelled) { reader.cancel(); break; }
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const raw = JSON.parse(line.slice(6));
            onMessage(toChatMessage(raw));
          } catch {}
        }
      }
    } catch { /* fall through to retry */ }

    if (!cancelled) retryTimer = setTimeout(connect, 10000);
  };

  connect();
  return () => { cancelled = true; clearTimeout(retryTimer); };
}
