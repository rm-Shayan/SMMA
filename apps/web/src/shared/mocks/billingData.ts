export interface LedgerEvent {
  id: string;
  date: string;
  type: 'Purchase' | 'Consume' | 'Release' | 'Reserve' | 'Allocate' | 'Revoke';
  runId?: string;
  actor: string;
  delta: number;
  balanceAfter: number;
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  date: string;
  description: string;
  amount: number;
  paymentMethod: string;
  status: 'Paid' | 'Pending' | 'Failed';
}

export const initialLedgerEvents: LedgerEvent[] = [
  {
    id: 'led-1',
    date: 'Nov 15, 2026 00:00',
    type: 'Purchase',
    actor: 'System Auto-renew',
    delta: 500,
    balanceAfter: 1000,
  },
  {
    id: 'led-2',
    date: 'Nov 14, 2026 11:15',
    type: 'Consume',
    runId: 'run_8f3a21',
    actor: 'Sarah Jenkins',
    delta: -15,
    balanceAfter: 500,
  },
  {
    id: 'led-3',
    date: 'Nov 13, 2026 18:42',
    type: 'Release',
    runId: 'run_912c40',
    actor: 'Ahmer Ali',
    delta: 10,
    balanceAfter: 515,
  },
  {
    id: 'led-4',
    date: 'Nov 12, 2026 09:30',
    type: 'Reserve',
    runId: 'run_33a871',
    actor: 'Elena Rostova',
    delta: -50,
    balanceAfter: 565,
  },
  {
    id: 'led-5',
    date: 'Nov 11, 2026 16:05',
    type: 'Allocate',
    actor: 'Alex Vance',
    delta: 50,
    balanceAfter: 575,
  },
  {
    id: 'led-6',
    date: 'Nov 10, 2026 13:20',
    type: 'Revoke',
    actor: 'Maya Lin',
    delta: -25,
    balanceAfter: 600,
  },
  {
    id: 'led-7',
    date: 'Nov 09, 2026 10:45',
    type: 'Consume',
    runId: 'run_44b109',
    actor: 'Sarah Jenkins',
    delta: -2,
    balanceAfter: 625,
  },
];

export const initialInvoices: InvoiceItem[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-011',
    date: 'Nov 14, 2026',
    description: '2,000 credits package',
    amount: 180.0,
    paymentMethod: 'Visa •• 4417',
    status: 'Paid',
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2026-010',
    date: 'Nov 01, 2026',
    description: '500 credits, auto-refresh',
    amount: 50.0,
    paymentMethod: 'Visa •• 4417',
    status: 'Paid',
  },
  {
    id: 'inv-3',
    invoiceNumber: 'INV-2026-009',
    date: 'Oct 01, 2026',
    description: '500 credits, auto-refresh',
    amount: 50.0,
    paymentMethod: 'Visa •• 4417',
    status: 'Paid',
  },
  {
    id: 'inv-4',
    invoiceNumber: 'INV-2026-008',
    date: 'Sep 15, 2026',
    description: '2,000 credits package',
    amount: 180.0,
    paymentMethod: 'Visa •• 4417',
    status: 'Paid',
  },
];
