export interface LineItem {
  id: number;
  description: string;
  quantity: number;
  rate: number;
}

export interface Invoice {
  id?: string;
  logoUrl: string;
  invoiceNumber: string;
  to: string;
  dueDate: string;
  subscriptionType: 'monthly' | 'yearly';
  lineItems: LineItem[];
}
