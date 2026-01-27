export type Platform =
  | "Gmail"
  | "Namecheap"
  | "GoDaddy"
  | "Netlify"
  | "Cursor"
  | "Lovable"
  | "Replit"
  | "Other";

export type ProjectStatus = "Ongoing" | "Completed" | "On Hold";
export type ProjectPaymentStatus = "Paid" | "Pending" | "Partial";
export type SubscriptionType = "Free Trial" | "Paid";

export type AttentionState = "stable" | "review" | "action" | "risk";

export type ActionItemContext = {
  type: "project" | "client";
  id: string;
};

export type ActionItem = {
  id: string;
  text: string;
  dueDate?: string | null;
  completed: boolean;
  context: ActionItemContext;
  createdAt: string;
};

export type ProjectLogEntry = {
  id: string;
  projectId: string;
  text: string;
  createdAt: string;
};

export type EmailAccountStatus = "Active" | "Not in use";
export type EmailProvider = "Gmail" | "Outlook" | "Yahoo" | "Zoho" | "Custom";

export type EmailAccountItem = {
  id: string;
  email: string;
  provider: EmailProvider;
  password?: string | null;
  recoveryEmail?: string | null;
  phone?: string | null;
  notes?: string | null;
  status: EmailAccountStatus;
  tags?: string[] | null;
};

export type ClientItem = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  createdAt?: string;
};

export type ProjectItem = {
  id: string;
  clientId?: string | null;
  clientName: string;
  projectName: string;
  domainName: string;
  domainProvider: "Namecheap" | "GoDaddy" | "Other";
  domainProviderOther?: string | null;
  domainEmailId: string;
  domainUsername?: string | null;
  hostingPlatform: string;
  deploymentEmailId: string;
  deploymentUsername?: string | null;
  domainPurchaseDate?: string | null;
  domainRenewalDate?: string | null;
  hostingStartDate?: string | null;
  hostingRenewalDate?: string | null;
  status: ProjectStatus;
  notes?: string | null;
  projectAmount?: number | null;
  paymentStatus?: ProjectPaymentStatus | null;
  completedDate?: string | null;
  pendingAmount?: number | null;
  attentionState?: AttentionState | null;
};

export type SubscriptionManualStatus = "Cancelled" | null;
export type SubscriptionComputedStatus = "Active" | "Expiring Soon" | "Expired" | "Cancelled";

export type AISubscriptionItem = {
  id: string;
  projectId?: string | null;
  toolName: string;
  platform: Platform;
  platformOther?: string | null;
  emailId: string;
  password?: string | null;
  subscriptionType: SubscriptionType;
  startDate?: string | null;
  endDate?: string | null;
  cancelByDate?: string | null;
  cost?: number | null;
  manualStatus?: SubscriptionManualStatus;
  notes?: string | null;
  attentionState?: AttentionState | null;
};

export type ServiceCadence = "One-time" | "Monthly" | "Yearly";
export type PaymentStatus = "Unpaid" | "Paid" | "Partial" | "Overdue";

export type InvoiceLineItem = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  total: number;
};

export type InvoiceItem = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string | null;
  clientId?: string | null;
  clientName: string;
  clientEmail?: string | null;
  clientAddress?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate?: number | null;
  taxAmount?: number | null;
  discountAmount?: number | null;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  notes?: string | null;
  createdAt: string;
};

export type BillingLogItem = {
  id: string;
  clientName: string;
  projectName?: string | null;
  serviceName: string;
  cadence: ServiceCadence;
  amount?: number | null;
  paymentStatus: PaymentStatus;
  paymentMode?: string | null;
  serviceDate?: string | null;
  notes?: string | null;
};

export type BusinessBranding = {
  businessName: string;
  tagline?: string | null;
  logoUrl?: string | null;
  upiQrUrl?: string | null;
  upiId?: string | null;
  mobile?: string | null;
  address?: string | null;
  email?: string | null;
};
