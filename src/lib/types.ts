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
export type SubscriptionType = "Free Trial" | "Paid";

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
  hostingStartDate?: string | null; // ISO date
  status: ProjectStatus;
  notes?: string | null;
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
};
