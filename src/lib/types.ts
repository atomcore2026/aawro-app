/** Shapes returned by the AAWRO API (see aawro-nestjs-backend). */
export type Unit = 'HOUR' | 'DAY';

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  rate: number;
  unit: Unit;
  published: boolean;
}

export interface ProviderCard {
  id: string;
  code: string;
  name: string;
  person: string;
  initials: string;
  photoUrl: string | null;
  coverUrl: string | null;
  verified: boolean;
  featured: boolean;
  rating: number;
  reviewCount: number;
  jobs: number;
  years: number;
  areaName: string;
  distanceKm: number | null;
  service: Service | null;
  fromRate: number | null;
  unit: Unit;
  thumbs: string[];
  nextOpen: string | null;
  categoryIds: string[];
}

export interface Review {
  id: string;
  bookingId: string;
  by: string;
  rating: number;
  service: string;
  text: string;
  tags: string[];
  reply: string | null;
  createdAt: string;
}

export interface ProviderProfile extends ProviderCard {
  about: string;
  languages: string[];
  categories: { id: string; name: string }[];
  services: Service[];
  availability: { workingDays: string[]; daysLabel: string; hoursLabel: string; weekly: Record<string, number[]> };
  portfolio: { id: string; imageUrl: string; caption: string }[];
  reviews: Review[];
  views: number;
  saved: boolean;
}

export interface Category {
  id: string;
  groupId: string;
  group?: string;
  name: string;
  unit: Unit;
  imageUrl: string;
  minRate: number;
  maxRate: number;
  defaultRate: number;
  proCount: number;
  fromRate: number | null;
  toRate: number | null;
}

export interface Group {
  id: string;
  name: string;
  unit: Unit;
  imageUrl: string;
  categoryCount: number;
  proCount: number;
  categories: Category[];
}

export interface TimelineStep {
  key: string;
  label: string;
  at: string | null;
  done: boolean;
}

export interface Booking {
  id: string;
  code: string;
  status: string;
  statusLabel: string;
  statusTone: string;
  version: number;
  createdAt: string;
  dateKey: string;
  startHour: number;
  startAt: string;
  endAt: string;
  duration: string;
  durationLabel: string;
  hours: number;
  serviceName: string;
  categoryId: string;
  providerServiceId: string;
  note: string;
  expiresAt: string | null;
  pricing: {
    rate: number;
    unit: Unit;
    serviceAmount: number;
    convenienceFee: number;
    convenienceGst: number;
    discount: number;
    customerTotal: number;
    commission?: number;
    commissionGst?: number;
    providerPayout?: number;
    mathLabel: string;
  };
  paymentStatus: string;
  cancelFee: number;
  cancelledBy: string | null;
  reason: string | null;
  acceptedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  paidAt: string | null;
  customer: { id: string; name: string; initials: string; phone: string } | null;
  provider: { id: string; name: string; person: string; initials: string; photoUrl: string | null; areaName: string; verified: boolean; rating: number } | null;
  address: { line1?: string; line2?: string; city?: string; areaName?: string; pincode?: string };
  timeline: TimelineStep[];
  events: { from: string | null; to: string; actorType: string; reason: string | null; at: string }[];
  review: { id: string; rating: number; text: string; tags: string[]; reply: string | null } | null;
  unread: number;
  actions: string[];
}

export interface Message {
  id: string;
  bookingId: string;
  senderRole: 'CUSTOMER' | 'PROVIDER' | 'SYSTEM';
  body: string;
  attachmentUrl: string | null;
  clientId: string | null;
  readAt: string | null;
  createdAt: string;
  pending?: boolean;
}

export interface Notification {
  id: string;
  kind: string;
  title: string;
  body: string;
  bookingId: string | null;
  read: boolean;
  createdAt: string;
}
