/**
 * Migration Script: localStorage → Supabase
 * 
 * This script exports data from localStorage and imports it into Supabase.
 * 
 * Usage:
 * 1. Open your app in browser with localStorage data
 * 2. Run `exportData()` in browser console to get JSON
 * 3. Save JSON to a file
 * 4. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
 * 5. Run: npx ts-node scripts/migrate-to-supabase.ts <path-to-json>
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface LocalStorageData {
  projects?: any[];
  aiSubscriptions?: any[];
  emailAccounts?: any[];
  invoices?: any[];
  actions?: any[];
  projectLogs?: any[];
  businessBranding?: any;
}

async function migrate(data: LocalStorageData) {
  console.log("Starting migration...\n");

  // Create clients from unique client names
  const clientNames = new Set<string>();
  data.projects?.forEach((p) => p.clientName && clientNames.add(p.clientName));
  data.invoices?.forEach((i) => i.clientName && clientNames.add(i.clientName));

  const clientMap: Record<string, string> = {};

  if (clientNames.size > 0) {
    console.log(`Creating ${clientNames.size} clients...`);
    for (const name of clientNames) {
      const { data: client, error } = await supabase
        .from("clients")
        .insert({ name })
        .select()
        .single();
      if (error) {
        console.error(`Failed to create client "${name}":`, error.message);
      } else {
        clientMap[name] = client.id;
        console.log(`  Created client: ${name} -> ${client.id}`);
      }
    }
  }

  // Migrate email accounts
  const emailMap: Record<string, string> = {};
  if (data.emailAccounts?.length) {
    console.log(`\nMigrating ${data.emailAccounts.length} email accounts...`);
    for (const email of data.emailAccounts) {
      const { data: created, error } = await supabase
        .from("email_accounts")
        .insert({
          email: email.email,
          password: email.password || "",
          provider: email.provider || "Other",
          status: email.status || "Active",
          tags: email.tags || [],
          notes: email.notes,
        })
        .select()
        .single();
      if (error) {
        console.error(`Failed to create email "${email.email}":`, error.message);
      } else {
        emailMap[email.id] = created.id;
        console.log(`  Created email: ${email.email} -> ${created.id}`);
      }
    }
  }

  // Migrate projects
  const projectMap: Record<string, string> = {};
  if (data.projects?.length) {
    console.log(`\nMigrating ${data.projects.length} projects...`);
    for (const project of data.projects) {
      const { data: created, error } = await supabase
        .from("projects")
        .insert({
          client_id: clientMap[project.clientName] || null,
          project_name: project.projectName,
          domain_name: project.domainName,
          domain_provider: project.domainProvider,
          domain_email_id: emailMap[project.domainEmailId] || null,
          domain_username: project.domainUsername,
          deployment_email_id: emailMap[project.deploymentEmailId] || null,
          deployment_username: project.deploymentUsername,
          hosting_platform: project.hostingPlatform || "Netlify",
          domain_purchase_date: project.domainPurchaseDate || null,
          domain_renewal_date: project.domainRenewalDate || null,
          hosting_start_date: project.hostingStartDate || null,
          hosting_renewal_date: project.hostingRenewalDate || null,
          status: project.status || "Ongoing",
          project_amount: project.projectAmount,
          payment_status: project.paymentStatus,
          pending_amount: project.pendingAmount,
          completed_date: project.completedDate || null,
          attention_state: project.attentionState,
          notes: project.notes,
        })
        .select()
        .single();
      if (error) {
        console.error(`Failed to create project "${project.projectName}":`, error.message);
      } else {
        projectMap[project.id] = created.id;
        console.log(`  Created project: ${project.projectName} -> ${created.id}`);
      }
    }
  }

  // Migrate invoices
  if (data.invoices?.length) {
    console.log(`\nMigrating ${data.invoices.length} invoices...`);
    for (const invoice of data.invoices) {
      const projectId = invoice.projectId ? projectMap[invoice.projectId] : null;
      const { data: created, error: invError } = await supabase
        .from("invoices")
        .insert({
          invoice_number: invoice.invoiceNumber,
          invoice_date: invoice.invoiceDate,
          due_date: invoice.dueDate || null,
          client_id: clientMap[invoice.clientName] || null,
          project_id: projectId,
          subtotal: invoice.subtotal || 0,
          tax_rate: invoice.taxRate,
          tax_amount: invoice.taxAmount,
          discount_amount: invoice.discountAmount,
          grand_total: invoice.grandTotal || 0,
          paid_amount: invoice.paidAmount || 0,
          balance_due: invoice.balanceDue || 0,
          payment_status: invoice.paymentStatus || "Unpaid",
          notes: invoice.notes,
        })
        .select()
        .single();

      if (invError) {
        console.error(`Failed to create invoice "${invoice.invoiceNumber}":`, invError.message);
        continue;
      }

      console.log(`  Created invoice: ${invoice.invoiceNumber} -> ${created.id}`);

      // Migrate line items
      if (invoice.lineItems?.length) {
        const items = invoice.lineItems.map((item: any) => ({
          invoice_id: created.id,
          description: item.description,
          quantity: item.quantity || 1,
          rate: item.rate || 0,
          total: item.total || 0,
        }));
        const { error: itemsError } = await supabase.from("invoice_items").insert(items);
        if (itemsError) {
          console.error(`  Failed to create line items:`, itemsError.message);
        }
      }
    }
  }

  // Migrate AI subscriptions
  if (data.aiSubscriptions?.length) {
    console.log(`\nMigrating ${data.aiSubscriptions.length} AI subscriptions...`);
    for (const sub of data.aiSubscriptions) {
      const projectId = sub.projectId ? projectMap[sub.projectId] : null;
      const { error } = await supabase.from("ai_subscriptions").insert({
        tool_name: sub.toolName,
        platform: sub.platform,
        subscription_type: sub.subscriptionType || "Paid",
        email_id: emailMap[sub.emailId] || null,
        project_id: projectId,
        password: sub.password,
        start_date: sub.startDate || null,
        end_date: sub.endDate || null,
        cancel_by_date: sub.cancelByDate || null,
        cost: sub.cost,
        manual_status: sub.manualStatus,
        attention_state: sub.attentionState,
        notes: sub.notes,
      });
      if (error) {
        console.error(`Failed to create subscription "${sub.toolName}":`, error.message);
      } else {
        console.log(`  Created subscription: ${sub.toolName}`);
      }
    }
  }

  // Migrate actions
  if (data.actions?.length) {
    console.log(`\nMigrating ${data.actions.length} action items...`);
    for (const action of data.actions) {
      const { error } = await supabase.from("action_items").insert({
        text: action.text,
        due_date: action.dueDate || null,
        completed: action.completed ?? false,
        context_type: action.context?.type || "project",
        context_id: action.context?.id || "",
      });
      if (error) {
        console.error(`Failed to create action:`, error.message);
      }
    }
    console.log(`  Created ${data.actions.length} action items`);
  }

  // Migrate project logs
  if (data.projectLogs?.length) {
    console.log(`\nMigrating ${data.projectLogs.length} project logs...`);
    for (const log of data.projectLogs) {
      const newProjectId = projectMap[log.projectId];
      if (!newProjectId) continue;
      const { error } = await supabase.from("project_logs").insert({
        project_id: newProjectId,
        text: log.text,
      });
      if (error) {
        console.error(`Failed to create log:`, error.message);
      }
    }
    console.log(`  Created project logs`);
  }

  // Migrate business branding
  if (data.businessBranding) {
    console.log(`\nMigrating business branding...`);
    const brandingData = {
      business_name: data.businessBranding.businessName || "NBK Business Solutions",
      tagline: data.businessBranding.tagline,
      logo_url: data.businessBranding.logoUrl,
      upi_qr_url: data.businessBranding.upiQrUrl,
      upi_id: data.businessBranding.upiId,
      mobile: data.businessBranding.mobile,
      address: data.businessBranding.address,
      email: data.businessBranding.email,
    };
    
    const { data: existing } = await supabase
      .from("business_branding")
      .select("id")
      .limit(1)
      .single();
    
    let error;
    if (existing) {
      const result = await supabase
        .from("business_branding")
        .update(brandingData)
        .eq("id", existing.id);
      error = result.error;
    } else {
      const result = await supabase
        .from("business_branding")
        .insert(brandingData);
      error = result.error;
    }
    
    if (error) {
      console.error(`Failed to update branding:`, error.message);
    } else {
      console.log(`  Updated business branding`);
    }
  }

  console.log("\n✅ Migration complete!");
}

// Browser export function (paste in console)
const exportFunction = `
function exportData() {
  const data = {
    projects: JSON.parse(localStorage.getItem('mockApiDb:v1') || '{}').projects || [],
    aiSubscriptions: JSON.parse(localStorage.getItem('mockApiDb:v1') || '{}').aiSubscriptions || [],
    emailAccounts: JSON.parse(localStorage.getItem('nbk.emailAccounts') || '[]'),
    invoices: JSON.parse(localStorage.getItem('nbk.invoices') || '[]'),
    actions: JSON.parse(localStorage.getItem('nbk.actions') || '[]'),
    projectLogs: JSON.parse(localStorage.getItem('nbk.projectLogs') || '[]'),
    businessBranding: JSON.parse(localStorage.getItem('nbk.businessBranding') || 'null'),
  };
  console.log(JSON.stringify(data, null, 2));
  return data;
}
`;

console.log("=== NBK Control Center Migration ===\n");
console.log("To export data from browser, run this in console:\n");
console.log(exportFunction);
console.log("\n");

const jsonPath = process.argv[2];
if (jsonPath) {
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw);
  migrate(data).catch(console.error);
} else {
  console.log("Usage: npx ts-node scripts/migrate-to-supabase.ts <path-to-exported-json>");
}
