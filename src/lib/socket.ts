import type { QueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { API_ORIGIN, tokens } from './api';

let socket: Socket | null = null;
const listeners = new Set<(event: string, payload: any) => void>();

/**
 * One Socket.IO connection per signed-in session. The socket is only a hint:
 * on every event we invalidate the affected queries and REST stays the truth.
 */
export function connectSocket(qc: QueryClient, refreshMe: () => Promise<unknown>) {
  if (socket) return socket;
  socket = io(`${API_ORIGIN}/rt`, {
    transports: ['websocket'],
    auth: (cb) => cb({ token: tokens.access }),
    reconnectionDelayMax: 10_000,
  });
  socket.on('booking.updated', (e) => {
    qc.invalidateQueries({ queryKey: ['booking', e.id] });
    qc.invalidateQueries({ queryKey: ['bookings'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    qc.invalidateQueries({ queryKey: ['conversations'] });
    emitLocal('booking.updated', e);
  });
  socket.on('booking.requested', (e) => {
    qc.invalidateQueries({ queryKey: ['bookings'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    emitLocal('booking.requested', e);
  });
  socket.on('message.new', (m) => {
    qc.invalidateQueries({ queryKey: ['messages', m.bookingId] });
    qc.invalidateQueries({ queryKey: ['conversations'] });
    emitLocal('message.new', m);
  });
  socket.on('message.read', (e) => qc.invalidateQueries({ queryKey: ['messages', e.bookingId] }));
  socket.on('typing', (e) => emitLocal('typing', e));
  socket.on('notification.new', () => {
    qc.invalidateQueries({ queryKey: ['notifications'] });
    refreshMe();
  });
  socket.on('payment.updated', (e) => {
    qc.invalidateQueries({ queryKey: ['booking', e.bookingId] });
    qc.invalidateQueries({ queryKey: ['bookings'] });
    qc.invalidateQueries({ queryKey: ['earnings'] });
  });
  socket.on('provider.rates', () => qc.invalidateQueries({ queryKey: ['provider'] }));
  socket.on('provider.hours', () => qc.invalidateQueries({ queryKey: ['open-hours'] }));
  socket.on('connect', () => qc.invalidateQueries());
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function joinBooking(bookingId: string): () => void {
  socket?.emit('booking.join', { bookingId });
  return () => {
    socket?.emit('booking.leave', { bookingId });
  };
}

export function watchProvider(providerId: string): () => void {
  socket?.emit('provider.watch', { providerId });
  return () => {
    socket?.emit('provider.unwatch', { providerId });
  };
}

export function sendTyping(bookingId: string) {
  socket?.emit('typing', { bookingId });
}

function emitLocal(event: string, payload: any) {
  listeners.forEach((l) => l(event, payload));
}

export function onSocketEvent(fn: (event: string, payload: any) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
