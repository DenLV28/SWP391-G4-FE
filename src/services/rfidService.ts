import { buildApiUrl, defaultHeaders } from './apiConfig';

export type RfidInfo = {
  rfidUid: string;
  vehicle: {
    id: string;
    licensePlate: string;
    vehicleType: string;
    brand: string;
    model: string;
  };
  owner: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
  };
};

export type RfidLookupResult =
  | { ok: true; data: RfidInfo }
  | { ok: false; error: string };

export async function fetchRfidInfo(uid: string): Promise<RfidLookupResult> {
  try {
    const res = await fetch(buildApiUrl(`/api/rfid/${encodeURIComponent(uid)}`), {
      headers: defaultHeaders(),
    });
    const body: { error?: string } & Partial<RfidInfo> = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message: string = body.error || 'Không tìm thấy thẻ RFID.';
      return { ok: false, error: message };
    }
    const data: RfidInfo = body as RfidInfo;
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'Không kết nối được tới máy chủ.' };
  }
}

export async function linkRfidCard(uid: string, licensePlate: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(buildApiUrl('/api/rfid/link'), {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ uid, licensePlate }),
    });
    const body: { error?: string } = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message: string = body.error || 'Không thể liên kết thẻ.';
      return { ok: false, error: message };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Không kết nối được tới máy chủ.' };
  }
}
