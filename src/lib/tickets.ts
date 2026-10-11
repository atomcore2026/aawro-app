/** Support tickets as returned by /tickets. */
export interface Ticket {
  id: string;
  code: string;
  kind: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  resolution: { outcome: string; reason: string; amount?: number } | null;
  messages: { id: string; authorType: string; authorName: string; body: string; at: string }[];
}

export const TICKET_TONE: Record<string, [string, string]> = {
  OPEN: ['Open', 'blue'],
  IN_PROGRESS: ['In progress', 'amber'],
  WAITING: ['Waiting', 'amber'],
  PENDING: ['Waiting', 'amber'],
  RESOLVED: ['Resolved', 'green'],
  CLOSED: ['Closed', 'grey'],
};
