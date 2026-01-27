export type Platform =
  | "Gmail"
  | "Namecheap"
  | "GoDaddy"
  | "Netlify"
  | "Cursor"
  | "Lovable"
  | "Replit"
  | "Other";

export type ProjectStatus = "Active" | "Completed" | "On Hold";
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

export type AccountVaultItem = {
  id: string;
  email: string;
  platform: Platform;
  platformOther?: string | null;
  username?: string | null;
  notes?: string | null;
  isActive: boolean;
};

export type ProjectItem = {
  id: string;
  clientName: string;
  projectName: string;
  domainName: string;
  domainProvider: "Namecheap" | "GoDaddy" | "Other";
  domainProviderOther?: string | null;
  domainEmailId: string; // FK to AccountVaultItem
  domainUsernameOverride?: string | null;
  hostingPlatform: string; // default Netlify
  deploymentEmailId: string; // FK to AccountVaultItem
  deploymentUsernameOverride?: string | null;
  domainPurchaseDate?: string | null; // ISO date
  domainRenewalDate?: string | null; // ISO date
  hostingStartDate?: string | null; // ISO date
  hostingRenewalDate?: string | null; // ISO date
  status: ProjectStatus;
  notes?: string | null;
  projectAmount?: number | null;
  paymentStatus?: ProjectPaymentStatus | null;
  completedDate?: string | null; // ISO date
  pendingAmount?: number | null;
  attentionState?: AttentionState | null;
};

export type SubscriptionManualStatus = "Cancelled" | null;
export type SubscriptionComputedStatus = "Active" | "Expiring Soon" | "Expired" | "Cancelled";

export type AISubscriptionItem = {
  id: string;
  toolName: string;
  platform: Platform;
  platformOther?: string | null;
  emailId: string; // FK to AccountVaultItem
  password?: string | null;
  subscriptionType: SubscriptionType;
  startDate?: string | null;
  endDate?: string | null;
  cancelByDate?: string | null;
  manualStatus?: SubscriptionManualStatus;
  notes?: string | null;
  attentionState?: AttentionState | null;
};

export type ServiceCadence = "One-time" | "Monthly" | "Yearly";
export type PaymentStatus = "Unpaid" | "Paid" | "Overdue";

export type ServiceCatalogItem = {
  id: string;
  serviceName: string;
  cadence: ServiceCadence;
  defaultAmount?: number | null;
  notes?: string | null;
  isActive: boolean;
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
  serviceDate?: string | null; // ISO date
  notes?: string | null;
};

export type EmailAccountStatus = "Active" | "Not in use";
export type EmailProvider = "Gmail" | "Outlook" | "Custom";

export type EmailAccountItem = {
  id: string;
  email: string;
  provider: EmailProvider;
  password?: string | null;
  recoveryEmail?: string | null;
  phone?: string | null;
  notes?: string | null;
  status: EmailAccountStatus;
};
