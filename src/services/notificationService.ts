import { buildApiUrl as buildUrl } from './apiConfig';

const headers = () => ({
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'ngrok-skip-browser-warning': '1',
});

export type AppNotification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  targetView: string;
  isRead: boolean;
  createdAt: string;
};

function toNotification(r: any): AppNotification {
  return {
    id: String(r.id || r.notification_id),
    userId: String(r.userId || r.user_id || ''),
    type: r.type || '',
    title: r.title || '',
    body: r.body || '',
    targetView: r.targetView || r.target_view || '',
    isRead: !!(r.isRead ?? r.is_read),
    createdAt: r.createdAt || r.created_at || '',
  };
}

export async function fetchNotifications(userId: string): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
  const res = await fetch(buildUrl(`/api/notifications?userId=${encodeURIComponent(userId)}`), { headers: headers() });
  if (!res.ok) throw new Error(`Notifications API ${res.status}`);
  const data = await res.json();
  return {
    notifications: (Array.isArray(data.notifications) ? data.notifications : []).map(toNotification),
    unreadCount: data.unreadCount ?? 0,
  };
}

export async function markNotificationRead(id: string): Promise<void> {
  await fetch(buildUrl(`/api/notifications/${encodeURIComponent(id)}/read`), {
    method: 'PUT',
    headers: headers(),
  });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await fetch(buildUrl('/api/notifications/read-all'), {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify({ userId }),
  });
}

/** Push-based bell sync — new notifications (e.g. staff confirming a booking) show up instantly. */
export function subscribeToNotificationEvents(onNew: (n: AppNotification) => void): () => void {
  let cancelled = false;
  let retryTimer: ReturnType<typeof setTimeout>;

  const connect = async () => {
    if (cancelled) return;
    try {
      const res = await fetch(buildUrl('/api/notifications/events'), {
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
            onNew(toNotification(raw));
          } catch {}
        }
      }
    } catch { /* fall through to retry */ }

    if (!cancelled) retryTimer = setTimeout(connect, 10000);
  };

  connect();
  return () => { cancelled = true; clearTimeout(retryTimer); };
}
