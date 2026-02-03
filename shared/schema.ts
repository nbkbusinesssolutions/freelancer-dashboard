import { pgTable, uuid, text, date, numeric, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const emailAccounts = pgTable("email_accounts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  provider: text("provider").notNull(),
  status: text("status").notNull().default("Active"),
  tags: text("tags").array(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  projectName: text("project_name").notNull(),
  domainName: text("domain_name"),
  domainProvider: text("domain_provider"),
  domainEmailId: uuid("domain_email_id").references(() => emailAccounts.id, { onDelete: "set null" }),
  domainUsername: text("domain_username"),
  deploymentEmailId: uuid("deployment_email_id").references(() => emailAccounts.id, { onDelete: "set null" }),
  deploymentUsername: text("deployment_username"),
  hostingPlatform: text("hosting_platform").default("Netlify"),
  domainPurchaseDate: date("domain_purchase_date"),
  domainRenewalDate: date("domain_renewal_date"),
  hostingStartDate: date("hosting_start_date"),
  hostingRenewalDate: date("hosting_renewal_date"),
  status: text("status").notNull().default("Ongoing"),
  projectAmount: numeric("project_amount"),
  paymentStatus: text("payment_status"),
  pendingAmount: numeric("pending_amount"),
  completedDate: date("completed_date"),
  attentionState: text("attention_state"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  clientIdIdx: index("idx_projects_client_id").on(table.clientId),
  statusIdx: index("idx_projects_status").on(table.status),
}));

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").unique().notNull(),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  invoiceDate: date("invoice_date").notNull(),
  dueDate: date("due_date"),
  subtotal: numeric("subtotal").notNull().default("0"),
  taxRate: numeric("tax_rate"),
  taxAmount: numeric("tax_amount"),
  discountAmount: numeric("discount_amount"),
  grandTotal: numeric("grand_total").notNull().default("0"),
  paidAmount: numeric("paid_amount").default("0"),
  balanceDue: numeric("balance_due").default("0"),
  paymentStatus: text("payment_status").notNull().default("Unpaid"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  clientIdIdx: index("idx_invoices_client_id").on(table.clientId),
  projectIdIdx: index("idx_invoices_project_id").on(table.projectId),
}));

export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: numeric("quantity").notNull().default("1"),
  rate: numeric("rate").notNull().default("0"),
  total: numeric("total").notNull().default("0"),
}, (table) => ({
  invoiceIdIdx: index("idx_invoice_items_invoice_id").on(table.invoiceId),
}));

export const aiSubscriptions = pgTable("ai_subscriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  toolName: text("tool_name").notNull(),
  platform: text("platform"),
  subscriptionType: text("subscription_type").notNull().default("Paid"),
  emailId: uuid("email_id").references(() => emailAccounts.id, { onDelete: "set null" }),
  password: text("password"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  cancelByDate: date("cancel_by_date"),
  cost: numeric("cost"),
  manualStatus: text("manual_status"),
  attentionState: text("attention_state"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  emailIdIdx: index("idx_ai_subscriptions_email_id").on(table.emailId),
}));

export const actionItems = pgTable("action_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  text: text("text").notNull(),
  dueDate: date("due_date"),
  completed: boolean("completed").default(false),
  contextType: text("context_type").notNull(),
  contextId: text("context_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  contextIdx: index("idx_action_items_context").on(table.contextType, table.contextId),
}));

export const projectLogs = pgTable("project_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  projectIdIdx: index("idx_project_logs_project_id").on(table.projectId),
}));

export const businessBranding = pgTable("business_branding", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  businessName: text("business_name").notNull().default("NBK Business Solutions"),
  tagline: text("tagline"),
  logoUrl: text("logo_url"),
  upiQrUrl: text("upi_qr_url"),
  upiId: text("upi_id"),
  mobile: text("mobile"),
  address: text("address"),
  email: text("email"),
  defaultHourlyRate: numeric("default_hourly_rate"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const effortLogs = pgTable("effort_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  hours: numeric("hours").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  projectIdIdx: index("idx_effort_logs_project_id").on(table.projectId),
}));

export const effortLogsRelations = relations(effortLogs, ({ one }) => ({
  project: one(projects, { fields: [effortLogs.projectId], references: [projects.id] }),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  projects: many(projects),
  invoices: many(invoices),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, { fields: [projects.clientId], references: [clients.id] }),
  domainEmail: one(emailAccounts, { fields: [projects.domainEmailId], references: [emailAccounts.id] }),
  deploymentEmail: one(emailAccounts, { fields: [projects.deploymentEmailId], references: [emailAccounts.id] }),
  logs: many(projectLogs),
  aiSubscriptions: many(aiSubscriptions),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, { fields: [invoices.clientId], references: [clients.id] }),
  project: one(projects, { fields: [invoices.projectId], references: [projects.id] }),
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, { fields: [invoiceItems.invoiceId], references: [invoices.id] }),
}));

export const aiSubscriptionsRelations = relations(aiSubscriptions, ({ one }) => ({
  project: one(projects, { fields: [aiSubscriptions.projectId], references: [projects.id] }),
  email: one(emailAccounts, { fields: [aiSubscriptions.emailId], references: [emailAccounts.id] }),
}));

export const projectLogsRelations = relations(projectLogs, ({ one }) => ({
  project: one(projects, { fields: [projectLogs.projectId], references: [projects.id] }),
}));
