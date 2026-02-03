import { differenceInDays, parseISO } from "date-fns";

export interface UrgencyItem {
  id: string;
  type: "overdue_invoice" | "pending_invoice" | "domain_renewal" | "hosting_renewal" | "ai_subscription" | "action_item";
  title: string;
  context: string;
  urgencyScore: number;
  daysOverdue?: number;
  daysLeft?: number;
  amount?: number;
  actionLabel: string;
  actionLink: string;
}

export interface UrgencyScoreConfig {
  overdueInvoice: { baseScore: number; multiplier: number };
  pendingInvoice: { baseScore: number; maxMultiplier: number };
  domainRenewal: { baseScore: number; multiplier: number; windowDays: number };
  hostingRenewal: { baseScore: number; multiplier: number; windowDays: number };
  aiSubscription: { baseScore: number; multiplier: number; windowDays: number };
  actionItem: { baseScore: number };
}

const DEFAULT_CONFIG: UrgencyScoreConfig = {
  overdueInvoice: { baseScore: 1000, multiplier: 1.2 },
  pendingInvoice: { baseScore: 500, maxMultiplier: 1.0 },
  domainRenewal: { baseScore: 300, multiplier: 1.1, windowDays: 30 },
  hostingRenewal: { baseScore: 300, multiplier: 1.1, windowDays: 30 },
  aiSubscription: { baseScore: 150, multiplier: 1.2, windowDays: 7 },
  actionItem: { baseScore: 250 },
};

function getDaysFromNow(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  try {
    return differenceInDays(parseISO(dateStr), new Date());
  } catch {
    return null;
  }
}

export function calculateOverdueInvoiceScore(
  daysOverdue: number,
  config = DEFAULT_CONFIG.overdueInvoice
): number {
  if (daysOverdue <= 0) return 0;
  return Math.round(config.baseScore * Math.pow(config.multiplier, daysOverdue));
}

export function calculatePendingInvoiceScore(
  daysUntilDue: number,
  totalDaysGiven: number,
  config = DEFAULT_CONFIG.pendingInvoice
): number {
  if (daysUntilDue <= 0) return 0;
  const progressRatio = Math.max(0, Math.min(1, 1 - daysUntilDue / Math.max(totalDaysGiven, 1)));
  const multiplier = 0.1 + progressRatio * (config.maxMultiplier - 0.1);
  return Math.round(config.baseScore * multiplier);
}

export function calculateRenewalScore(
  daysLeft: number,
  config: { baseScore: number; multiplier: number; windowDays: number }
): number {
  if (daysLeft > config.windowDays) return 0;
  if (daysLeft < 0) {
    return Math.round(config.baseScore * Math.pow(config.multiplier, Math.abs(daysLeft) + config.windowDays));
  }
  const daysIntoWindow = config.windowDays - daysLeft;
  return Math.round(config.baseScore * Math.pow(config.multiplier, daysIntoWindow));
}

export function calculateActionItemScore(
  isUrgent: boolean,
  config = DEFAULT_CONFIG.actionItem
): number {
  return isUrgent ? config.baseScore : 0;
}

export interface InvoiceForUrgency {
  id: string;
  invoiceNumber: string;
  clientName: string;
  grandTotal: number;
  balanceDue: number;
  paymentStatus: string;
  dueDate: string | null;
  invoiceDate: string;
}

export interface ProjectForUrgency {
  id: string;
  clientName: string;
  projectName: string;
  domainName?: string | null;
  domainRenewalDate?: string | null;
  hostingRenewalDate?: string | null;
  pendingAmount?: number | null;
  paymentStatus?: string | null;
}

export interface AISubscriptionForUrgency {
  id: string;
  toolName: string;
  cancelByDate?: string | null;
  manualStatus?: string | null;
  cost?: number | null;
}

export interface ActionItemForUrgency {
  id: string;
  text: string;
  dueDate?: string | null;
  completed: boolean;
  context: { type: string; id: string };
}

export function computeAllUrgencyItems(
  invoices: InvoiceForUrgency[],
  projects: ProjectForUrgency[],
  aiSubscriptions: AISubscriptionForUrgency[],
  actionItems: ActionItemForUrgency[],
  config = DEFAULT_CONFIG
): UrgencyItem[] {
  const items: UrgencyItem[] = [];
  const today = new Date();

  invoices.forEach((inv) => {
    if (inv.paymentStatus === "Paid") return;
    
    const dueDate = inv.dueDate ? parseISO(inv.dueDate) : null;
    const daysUntilDue = dueDate ? differenceInDays(dueDate, today) : null;

    if (inv.paymentStatus === "Overdue" || (daysUntilDue !== null && daysUntilDue < 0)) {
      const daysOverdue = daysUntilDue !== null ? Math.abs(daysUntilDue) : 1;
      const score = calculateOverdueInvoiceScore(daysOverdue, config.overdueInvoice);
      items.push({
        id: inv.id,
        type: "overdue_invoice",
        title: `Invoice ${inv.invoiceNumber} is ${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue`,
        context: `Client: ${inv.clientName}, Amount: ₹${inv.balanceDue.toLocaleString("en-IN")}`,
        urgencyScore: score,
        daysOverdue,
        amount: inv.balanceDue,
        actionLabel: "Send Reminder",
        actionLink: `/invoices?reminder=${inv.id}`,
      });
    } else if (inv.paymentStatus === "Unpaid" || inv.paymentStatus === "Partial") {
      if (daysUntilDue !== null && daysUntilDue >= 0) {
        const invoiceDate = parseISO(inv.invoiceDate);
        const totalDaysGiven = dueDate ? differenceInDays(dueDate, invoiceDate) : 30;
        const score = calculatePendingInvoiceScore(daysUntilDue, totalDaysGiven, config.pendingInvoice);
        if (score > 0) {
          items.push({
            id: inv.id,
            type: "pending_invoice",
            title: `Invoice ${inv.invoiceNumber} due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}`,
            context: `Client: ${inv.clientName}, Amount: ₹${inv.balanceDue.toLocaleString("en-IN")}`,
            urgencyScore: score,
            daysLeft: daysUntilDue,
            amount: inv.balanceDue,
            actionLabel: "View Invoice",
            actionLink: `/invoices?preview=${inv.id}`,
          });
        }
      }
    }
  });

  projects.forEach((proj) => {
    const domainDays = getDaysFromNow(proj.domainRenewalDate);
    if (domainDays !== null && domainDays <= config.domainRenewal.windowDays) {
      const score = calculateRenewalScore(domainDays, config.domainRenewal);
      items.push({
        id: `domain-${proj.id}`,
        type: "domain_renewal",
        title: domainDays < 0 
          ? `Domain for "${proj.domainName}" expired ${Math.abs(domainDays)} days ago`
          : `Domain renewal for "${proj.domainName}" in ${domainDays} day${domainDays === 1 ? "" : "s"}`,
        context: `Client: ${proj.clientName}`,
        urgencyScore: score,
        daysLeft: domainDays,
        actionLabel: "View Renewal",
        actionLink: `/projects/${proj.id}`,
      });
    }

    const hostingDays = getDaysFromNow(proj.hostingRenewalDate);
    if (hostingDays !== null && hostingDays <= config.hostingRenewal.windowDays) {
      const score = calculateRenewalScore(hostingDays, config.hostingRenewal);
      items.push({
        id: `hosting-${proj.id}`,
        type: "hosting_renewal",
        title: hostingDays < 0
          ? `Hosting for "${proj.projectName}" expired ${Math.abs(hostingDays)} days ago`
          : `Hosting renewal for "${proj.projectName}" in ${hostingDays} day${hostingDays === 1 ? "" : "s"}`,
        context: `Client: ${proj.clientName}`,
        urgencyScore: score,
        daysLeft: hostingDays,
        actionLabel: "View Renewal",
        actionLink: `/projects/${proj.id}`,
      });
    }
  });

  aiSubscriptions.forEach((sub) => {
    if (sub.manualStatus === "Cancelled") return;
    const daysLeft = getDaysFromNow(sub.cancelByDate);
    if (daysLeft !== null && daysLeft <= config.aiSubscription.windowDays) {
      const score = calculateRenewalScore(daysLeft, config.aiSubscription);
      items.push({
        id: sub.id,
        type: "ai_subscription",
        title: daysLeft < 0
          ? `AI subscription "${sub.toolName}" expired ${Math.abs(daysLeft)} days ago`
          : `AI subscription "${sub.toolName}" expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
        context: sub.cost ? `Monthly cost: ₹${sub.cost.toLocaleString("en-IN")}` : "Free trial",
        urgencyScore: score,
        daysLeft,
        amount: sub.cost ?? undefined,
        actionLabel: "Review Subscription",
        actionLink: `/ai-subscriptions?focus=${sub.id}`,
      });
    }
  });

  actionItems.forEach((action) => {
    if (action.completed) return;
    const daysLeft = getDaysFromNow(action.dueDate);
    const isUrgent = daysLeft !== null && daysLeft <= 1;
    if (isUrgent) {
      const score = calculateActionItemScore(true, config.actionItem);
      items.push({
        id: action.id,
        type: "action_item",
        title: `Task "${action.text.slice(0, 50)}${action.text.length > 50 ? "..." : ""}" is due ${daysLeft === 0 ? "today" : daysLeft < 0 ? `${Math.abs(daysLeft)} days ago` : "tomorrow"}`,
        context: `Type: ${action.context.type}`,
        urgencyScore: score,
        daysLeft,
        actionLabel: "View Task",
        actionLink: action.context.type === "project" ? `/projects/${action.context.id}` : `/`,
      });
    }
  });

  return items.sort((a, b) => b.urgencyScore - a.urgencyScore);
}

export function getTopUrgencyItem(items: UrgencyItem[]): UrgencyItem | null {
  if (items.length === 0) return null;
  return items[0];
}

export function isAllClear(items: UrgencyItem[], threshold = 200): boolean {
  return items.every((item) => item.urgencyScore < threshold);
}

export function getFinancialVitals(
  invoices: InvoiceForUrgency[],
  aiSubscriptions: AISubscriptionForUrgency[],
  projects: ProjectForUrgency[]
): {
  totalPendingPayments: number;
  revenueThisMonth: number;
  thirtyDayExpenseHorizon: number;
} {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const totalPendingPayments = invoices
    .filter((inv) => inv.paymentStatus !== "Paid")
    .reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

  const revenueThisMonth = invoices
    .filter((inv) => {
      if (inv.paymentStatus !== "Paid") return false;
      const invDate = parseISO(inv.invoiceDate);
      return invDate >= startOfMonth;
    })
    .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

  let thirtyDayExpenseHorizon = 0;
  
  aiSubscriptions.forEach((sub) => {
    if (sub.manualStatus === "Cancelled") return;
    const daysLeft = getDaysFromNow(sub.cancelByDate);
    if (daysLeft !== null && daysLeft <= 30 && daysLeft >= 0) {
      thirtyDayExpenseHorizon += sub.cost || 0;
    }
  });

  return {
    totalPendingPayments,
    revenueThisMonth,
    thirtyDayExpenseHorizon,
  };
}
