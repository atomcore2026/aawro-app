import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// In Expo Go, "localhost" points at the phone, not your computer. When
// EXPO_PUBLIC_API_URL isn't set, reuse the dev server's LAN host instead.
function resolveApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }
  const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
  return `http://${host}:3000/api`;
}

export const API_URL = resolveApiUrl();
/** Origin of the API (for sockets and `/uploads/...` files). */
export const API_ORIGIN = API_URL.replace(/\/api$/, '');

const ACCESS = 'aawro.access';
const REFRESH = 'aawro.refresh';

// SecureStore isn't available on web; fall back to localStorage there.
const store = {
  get: (k: string) => (Platform.OS === 'web' ? Promise.resolve(globalThis.localStorage?.getItem(k) ?? null) : SecureStore.getItemAsync(k)),
  set: (k: string, v: string) => (Platform.OS === 'web' ? Promise.resolve(globalThis.localStorage?.setItem(k, v)) : SecureStore.setItemAsync(k, v)),
  del: (k: string) => (Platform.OS === 'web' ? Promise.resolve(globalThis.localStorage?.removeItem(k)) : SecureStore.deleteItemAsync(k)),
};

let accessToken: string | null = null;
let refreshing: Promise<boolean> | null = null;
let onSignedOut: (() => void) | null = null;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

export const tokens = {
  async load() {
    accessToken = await store.get(ACCESS);
    return { accessToken, refreshToken: await store.get(REFRESH) };
  },
  async save(access: string, refresh: string) {
    accessToken = access;
    await store.set(ACCESS, access);
    await store.set(REFRESH, refresh);
  },
  async clear() {
    accessToken = null;
    await store.del(ACCESS);
    await store.del(REFRESH);
  },
  get access() {
    return accessToken;
  },
  onSignedOut(fn: () => void) {
    onSignedOut = fn;
  },
};

async function refresh(): Promise<boolean> {
  const refreshToken = await store.get(REFRESH);
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    await tokens.save(json.accessToken, json.refreshToken);
    return true;
  } catch {
    return false;
  }
}

/** JSON fetch with the access token; refreshes once on 401, then signs out. */
export async function api<T = any>(path: string, init: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const send = () =>
    fetch(`${API_URL}${path}`, {
      method: init.method ?? (init.body !== undefined ? 'POST' : 'GET'),
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && init.auth !== false ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });

  let res: Response;
  try {
    res = await send();
  } catch {
    throw new ApiError(0, 'OFFLINE', 'You seem to be offline. Check your connection and try again.');
  }
  if (res.status === 401 && accessToken && init.auth !== false) {
    refreshing ??= refresh().finally(() => (refreshing = null));
    if (await refreshing) res = await send();
    else {
      await tokens.clear();
      onSignedOut?.();
    }
  }
  const text = await res.text();
  const json = text ? safeJson(text) : null;
  if (!res.ok) {
    const e = json?.error;
    throw new ApiError(res.status, e?.code ?? 'ERROR', e?.message ?? 'Something went wrong', e?.details ?? {});
  }
  return json as T;
}

function safeJson(t: string) {
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

/** Uploads a local image (from expo-image-picker) and returns its URL. */
export async function uploadImage(uri: string, name = 'photo.jpg', type = 'image/jpeg'): Promise<string> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    form.append('file', blob, name);
  } else {
    form.append('file', { uri, name, type } as any);
  }
  const res = await fetch(`${API_URL}/files`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    body: form,
  });
  const json = await res.json();
  if (!res.ok) throw new ApiError(res.status, json?.error?.code ?? 'ERROR', json?.error?.message ?? 'Upload failed');
  return json.url?.startsWith('http') ? json.url : json.path;
}

/** Resolves `/uploads/...` paths returned by the API to full URLs. */
export function fileUrl(u?: string | null): string | undefined {
  if (!u) return undefined;
  return u.startsWith('/') ? `${API_ORIGIN}${u}` : u;
}
