import type { Express } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db } from "./db";
import * as schema from "../shared/schema";

function toNullIfEmpty(val: any): any {
  if (val === "" || val === undefined) return null;
  return val;
}

export function registerRoutes(app: Express) {
  app.get("/api/clients", async (req, res) => {
    try {
      const id = req.query.id as string | undefined;
      if (id) {
        const result = await db.query.clients.findFirst({
          where: eq(schema.clients.id, id),
        });
        if (!result) return res.status(404).json({ error: "Not found" });
        return res.json(transformClient(result));
      }
      const results = await db.query.clients.findMany({
        orderBy: desc(schema.clients.createdAt),
      });
      return res.json({ items: results.map(transformClient) });
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const body = req.body;
      const [result] = await db.insert(schema.clients).values({
        name: body.name,
        email: body.email,
        phone: body.phone,
        notes: body.notes,
      }).returning();
      return res.status(201).json(transformClient(result));
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.put("/api/clients", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: "Missing id parameter" });
      const body = req.body;
      const [result] = await db.update(schema.clients)
        .set({
          name: body.name,
          email: body.email,
          phone: body.phone,
          notes: body.notes,
        })
        .where(eq(schema.clients.id, id))
        .returning();
      return res.json(transformClient(result));
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.delete("/api/clients", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: "Missing id parameter" });
      await db.delete(schema.clients).where(eq(schema.clients.id, id));
      return res.json({ success: true });
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.get("/api/email-accounts", async (req, res) => {
    try {
      const id = req.query.id as string | undefined;
      if (id) {
        const result = await db.query.emailAccounts.findFirst({
          where: eq(schema.emailAccounts.id, id),
        });
        if (!result) return res.status(404).json({ error: "Not found" });
        return res.json(transformEmailAccount(result));
      }
      const results = await db.query.emailAccounts.findMany({
        orderBy: desc(schema.emailAccounts.createdAt),
      });
      return res.json({ items: results.map(transformEmailAccount) });
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.post("/api/email-accounts", async (req, res) => {
    try {
      const body = req.body;
      const [result] = await db.insert(schema.emailAccounts).values({
        email: body.email,
        password: body.password,
        provider: body.provider,
        status: body.status,
        tags: body.tags,
        notes: body.notes,
      }).returning();
      return res.status(201).json(transformEmailAccount(result));
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.put("/api/email-accounts", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: "Missing id parameter" });
      const body = req.body;
      const [result] = await db.update(schema.emailAccounts)
        .set({
          email: body.email,
          password: body.password,
          provider: body.provider,
          status: body.status,
          tags: body.tags,
          notes: body.notes,
        })
        .where(eq(schema.emailAccounts.id, id))
        .returning();
      return res.json(transformEmailAccount(result));
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.delete("/api/email-accounts", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: "Missing id parameter" });
      await db.delete(schema.emailAccounts).where(eq(schema.emailAccounts.id, id));
      return res.json({ success: true });
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.get("/api/projects", async (req, res) => {
    try {
      const id = req.query.id as string | undefined;
      if (id) {
        const result = await db.query.projects.findFirst({
          where: eq(schema.projects.id, id),
          with: {
            client: true,
            domainEmail: true,
            deploymentEmail: true,
          },
        });
        if (!result) return res.status(404).json({ error: "Not found" });
        return res.json(transformProject(result));
      }
      const results = await db.query.projects.findMany({
        orderBy: desc(schema.projects.createdAt),
        with: {
          client: true,
          domainEmail: true,
          deploymentEmail: true,
        },
      });
      return res.json({ items: results.map(transformProject) });
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const body = req.body;
      let clientId = body.clientId;
      
      if (!clientId && body.clientName) {
        const existingClient = await db.query.clients.findFirst({
          where: eq(schema.clients.name, body.clientName),
        });
        if (existingClient) {
          clientId = existingClient.id;
        } else {
          const [newClient] = await db.insert(schema.clients).values({
            name: body.clientName,
          }).returning();
          clientId = newClient.id;
        }
      }
      
      const [result] = await db.insert(schema.projects).values({
        clientId: toNullIfEmpty(clientId),
        projectName: body.projectName,
        domainName: toNullIfEmpty(body.domainName),
        domainProvider: toNullIfEmpty(body.domainProvider),
        domainEmailId: toNullIfEmpty(body.domainEmailId),
        domainUsername: toNullIfEmpty(body.domainUsername),
        deploymentEmailId: toNullIfEmpty(body.deploymentEmailId),
        deploymentUsername: toNullIfEmpty(body.deploymentUsername),
        hostingPlatform: toNullIfEmpty(body.hostingPlatform),
        domainPurchaseDate: toNullIfEmpty(body.domainPurchaseDate),
        domainRenewalDate: toNullIfEmpty(body.domainRenewalDate),
        hostingStartDate: toNullIfEmpty(body.hostingStartDate),
        hostingRenewalDate: toNullIfEmpty(body.hostingRenewalDate),
        status: body.status || "Ongoing",
        projectAmount: toNullIfEmpty(body.projectAmount),
        paymentStatus: toNullIfEmpty(body.paymentStatus),
        pendingAmount: toNullIfEmpty(body.pendingAmount),
        completedDate: toNullIfEmpty(body.completedDate),
        attentionState: toNullIfEmpty(body.attentionState),
        notes: toNullIfEmpty(body.notes),
      }).returning();
      return res.status(201).json(transformProject(result));
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.put("/api/projects", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: "Missing id parameter" });
      const body = req.body;
      const [result] = await db.update(schema.projects)
        .set({
          clientId: toNullIfEmpty(body.clientId),
          projectName: body.projectName,
          domainName: toNullIfEmpty(body.domainName),
          domainProvider: toNullIfEmpty(body.domainProvider),
          domainEmailId: toNullIfEmpty(body.domainEmailId),
          domainUsername: toNullIfEmpty(body.domainUsername),
          deploymentEmailId: toNullIfEmpty(body.deploymentEmailId),
          deploymentUsername: toNullIfEmpty(body.deploymentUsername),
          hostingPlatform: toNullIfEmpty(body.hostingPlatform),
          domainPurchaseDate: toNullIfEmpty(body.domainPurchaseDate),
          domainRenewalDate: toNullIfEmpty(body.domainRenewalDate),
          hostingStartDate: toNullIfEmpty(body.hostingStartDate),
          hostingRenewalDate: toNullIfEmpty(body.hostingRenewalDate),
          status: body.status,
          projectAmount: toNullIfEmpty(body.projectAmount),
          paymentStatus: toNullIfEmpty(body.paymentStatus),
          pendingAmount: toNullIfEmpty(body.pendingAmount),
          completedDate: toNullIfEmpty(body.completedDate),
          attentionState: toNullIfEmpty(body.attentionState),
          notes: toNullIfEmpty(body.notes),
        })
        .where(eq(schema.projects.id, id))
        .returning();
      return res.json(transformProject(result));
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.delete("/api/projects", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: "Missing id parameter" });
      await db.delete(schema.projects).where(eq(schema.projects.id, id));
      return res.json({ success: true });
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.get("/api/invoices", async (req, res) => {
    try {
      const id = req.query.id as string | undefined;
      if (id) {
        const result = await db.query.invoices.findFirst({
          where: eq(schema.invoices.id, id),
          with: {
            client: true,
            project: true,
            items: true,
          },
        });
        if (!result) return res.status(404).json({ error: "Not found" });
        return res.json(transformInvoice(result));
      }
      const results = await db.query.invoices.findMany({
        orderBy: desc(schema.invoices.createdAt),
        with: {
          client: true,
          project: true,
          items: true,
        },
      });
      return res.json({ items: results.map(transformInvoice) });
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const { lineItems, ...invoiceData } = req.body;
      let clientId = invoiceData.clientId;
      
      if (!clientId && invoiceData.clientName) {
        const existingClient = await db.query.clients.findFirst({
          where: eq(schema.clients.name, invoiceData.clientName),
        });
        if (existingClient) {
          clientId = existingClient.id;
        } else {
          const [newClient] = await db.insert(schema.clients).values({
            name: invoiceData.clientName,
          }).returning();
          clientId = newClient.id;
        }
      }
      
      const [invoice] = await db.insert(schema.invoices).values({
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceDate: invoiceData.invoiceDate,
        dueDate: invoiceData.dueDate || null,
        clientId: clientId,
        projectId: invoiceData.projectId || null,
        subtotal: invoiceData.subtotal,
        taxRate: invoiceData.taxRate,
        taxAmount: invoiceData.taxAmount,
        discountAmount: invoiceData.discountAmount,
        grandTotal: invoiceData.grandTotal,
        paidAmount: invoiceData.paidAmount,
        balanceDue: invoiceData.balanceDue,
        paymentStatus: invoiceData.paymentStatus,
        notes: invoiceData.notes,
      }).returning();
      
      if (lineItems && lineItems.length > 0) {
        await db.insert(schema.invoiceItems).values(
          lineItems.map((item: any) => ({
            invoiceId: invoice.id,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            total: item.total,
          }))
        );
      }
      
      return res.status(201).json({ ...transformInvoice(invoice), lineItems });
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.put("/api/invoices", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: "Missing id parameter" });
      const { lineItems, ...invoiceData } = req.body;
      
      const [invoice] = await db.update(schema.invoices)
        .set({
          invoiceNumber: invoiceData.invoiceNumber,
          invoiceDate: invoiceData.invoiceDate,
          dueDate: invoiceData.dueDate || null,
          clientId: invoiceData.clientId,
          projectId: invoiceData.projectId || null,
          subtotal: invoiceData.subtotal,
          taxRate: invoiceData.taxRate,
          taxAmount: invoiceData.taxAmount,
          discountAmount: invoiceData.discountAmount,
          grandTotal: invoiceData.grandTotal,
          paidAmount: invoiceData.paidAmount,
          balanceDue: invoiceData.balanceDue,
          paymentStatus: invoiceData.paymentStatus,
          notes: invoiceData.notes,
        })
        .where(eq(schema.invoices.id, id))
        .returning();
      
      await db.delete(schema.invoiceItems).where(eq(schema.invoiceItems.invoiceId, id));
      
      if (lineItems && lineItems.length > 0) {
        await db.insert(schema.invoiceItems).values(
          lineItems.map((item: any) => ({
            invoiceId: id,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            total: item.total,
          }))
        );
      }
      
      return res.json({ ...transformInvoice(invoice), lineItems });
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.delete("/api/invoices", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: "Missing id parameter" });
      await db.delete(schema.invoices).where(eq(schema.invoices.id, id));
      return res.json({ success: true });
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.get("/api/ai-subscriptions", async (req, res) => {
    try {
      const id = req.query.id as string | undefined;
      if (id) {
        const result = await db.query.aiSubscriptions.findFirst({
          where: eq(schema.aiSubscriptions.id, id),
          with: {
            project: true,
            email: true,
          },
        });
        if (!result) return res.status(404).json({ error: "Not found" });
        return res.json(transformSubscription(result));
      }
      const results = await db.query.aiSubscriptions.findMany({
        orderBy: desc(schema.aiSubscriptions.createdAt),
        with: {
          project: true,
          email: true,
        },
      });
      return res.json({ items: results.map(transformSubscription) });
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.post("/api/ai-subscriptions", async (req, res) => {
    try {
      const body = req.body;
      const [result] = await db.insert(schema.aiSubscriptions).values({
        projectId: toNullIfEmpty(body.projectId),
        toolName: body.toolName,
        platform: toNullIfEmpty(body.platform),
        subscriptionType: body.subscriptionType,
        emailId: toNullIfEmpty(body.emailId),
        password: toNullIfEmpty(body.password),
        startDate: toNullIfEmpty(body.startDate),
        endDate: toNullIfEmpty(body.endDate),
        cancelByDate: toNullIfEmpty(body.cancelByDate),
        cost: toNullIfEmpty(body.cost),
        manualStatus: toNullIfEmpty(body.manualStatus),
        attentionState: toNullIfEmpty(body.attentionState),
        notes: toNullIfEmpty(body.notes),
      }).returning();
      return res.status(201).json(transformSubscription(result));
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.put("/api/ai-subscriptions", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: "Missing id parameter" });
      const body = req.body;
      const [result] = await db.update(schema.aiSubscriptions)
        .set({
          projectId: toNullIfEmpty(body.projectId),
          toolName: body.toolName,
          platform: toNullIfEmpty(body.platform),
          subscriptionType: body.subscriptionType,
          emailId: toNullIfEmpty(body.emailId),
          password: toNullIfEmpty(body.password),
          startDate: toNullIfEmpty(body.startDate),
          endDate: toNullIfEmpty(body.endDate),
          cancelByDate: toNullIfEmpty(body.cancelByDate),
          cost: toNullIfEmpty(body.cost),
          manualStatus: toNullIfEmpty(body.manualStatus),
          attentionState: toNullIfEmpty(body.attentionState),
          notes: toNullIfEmpty(body.notes),
        })
        .where(eq(schema.aiSubscriptions.id, id))
        .returning();
      return res.json(transformSubscription(result));
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.delete("/api/ai-subscriptions", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: "Missing id parameter" });
      await db.delete(schema.aiSubscriptions).where(eq(schema.aiSubscriptions.id, id));
      return res.json({ success: true });
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.get("/api/actions", async (req, res) => {
    try {
      const contextType = req.query.contextType as string | undefined;
      const contextId = req.query.contextId as string | undefined;
      
      let results;
      if (contextType && contextId) {
        results = await db.query.actionItems.findMany({
          where: and(
            eq(schema.actionItems.contextType, contextType),
            eq(schema.actionItems.contextId, contextId)
          ),
          orderBy: desc(schema.actionItems.createdAt),
        });
      } else {
        results = await db.query.actionItems.findMany({
          orderBy: desc(schema.actionItems.createdAt),
        });
      }
      return res.json({ items: results.map(transformAction) });
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.post("/api/actions", async (req, res) => {
    try {
      const body = req.body;
      const [result] = await db.insert(schema.actionItems).values({
        text: body.text,
        dueDate: body.dueDate || null,
        completed: body.completed ?? false,
        contextType: body.context?.type,
        contextId: body.context?.id,
      }).returning();
      return res.status(201).json(transformAction(result));
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.put("/api/actions", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: "Missing id parameter" });
      const body = req.body;
      const [result] = await db.update(schema.actionItems)
        .set({
          text: body.text,
          dueDate: body.dueDate || null,
          completed: body.completed ?? false,
          contextType: body.context?.type,
          contextId: body.context?.id,
        })
        .where(eq(schema.actionItems.id, id))
        .returning();
      return res.json(transformAction(result));
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.delete("/api/actions", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: "Missing id parameter" });
      await db.delete(schema.actionItems).where(eq(schema.actionItems.id, id));
      return res.json({ success: true });
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.get("/api/project-logs", async (req, res) => {
    try {
      const projectId = req.query.projectId as string | undefined;
      
      let results;
      if (projectId) {
        results = await db.query.projectLogs.findMany({
          where: eq(schema.projectLogs.projectId, projectId),
          orderBy: desc(schema.projectLogs.createdAt),
        });
      } else {
        results = await db.query.projectLogs.findMany({
          orderBy: desc(schema.projectLogs.createdAt),
        });
      }
      return res.json({ items: results.map(transformLog) });
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.post("/api/project-logs", async (req, res) => {
    try {
      const body = req.body;
      const [result] = await db.insert(schema.projectLogs).values({
        projectId: body.projectId,
        text: body.text,
      }).returning();
      return res.status(201).json(transformLog(result));
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.delete("/api/project-logs", async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: "Missing id parameter" });
      await db.delete(schema.projectLogs).where(eq(schema.projectLogs.id, id));
      return res.json({ success: true });
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.get("/api/branding", async (req, res) => {
    try {
      const result = await db.query.businessBranding.findFirst();
      if (!result) return res.status(404).json({ error: "Not found" });
      return res.json(transformBranding(result));
    } catch (err) {
      return res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  app.put("/api/branding", async (req, res) => {
    try {
      const body = req.body;
      const existing = await db.query.businessBranding.findFirst();
      
      if (existing) {
        const [result] = await db.update(schema.businessBranding)
          .set({
            businessName: body.businessName,
            tagline: body.tagline,
            logoUrl: body.logoUrl,
            upiQrUrl: body.upiQrUrl,
            upiId: body.upiId,
            mobile: body.mobile,
            address: body.address,
            email: body.email,
            updatedAt: new Date(),
          })
          .where(eq(schema.businessBranding.id, existing.id))
          .returning();
        return res.json(transformBranding(result));
      } else {
        const [result] = await db.insert(schema.businessBranding).values({
          businessName: body.businessName,
          tagline: body.tagline,
          logoUrl: body.logoUrl,
          upiQrUrl: body.upiQrUrl,
          upiId: body.upiId,
          mobile: body.mobile,
          address: body.address,
          email: body.email,
        }).returning();
        return res.status(201).json(transformBranding(result));
      }
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  });
}

function transformClient(row: any) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    notes: row.notes,
    createdAt: row.createdAt,
  };
}

function transformEmailAccount(row: any) {
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    provider: row.provider,
    status: row.status,
    tags: row.tags,
    notes: row.notes,
    createdAt: row.createdAt,
  };
}

function transformProject(row: any) {
  return {
    id: row.id,
    clientId: row.clientId,
    clientName: row.client?.name || "",
    projectName: row.projectName,
    domainName: row.domainName,
    domainProvider: row.domainProvider,
    domainEmailId: row.domainEmailId,
    domainUsername: row.domainUsername,
    deploymentEmailId: row.deploymentEmailId,
    deploymentUsername: row.deploymentUsername,
    hostingPlatform: row.hostingPlatform,
    domainPurchaseDate: row.domainPurchaseDate,
    domainRenewalDate: row.domainRenewalDate,
    hostingStartDate: row.hostingStartDate,
    hostingRenewalDate: row.hostingRenewalDate,
    status: row.status,
    projectAmount: row.projectAmount,
    paymentStatus: row.paymentStatus,
    pendingAmount: row.pendingAmount,
    completedDate: row.completedDate,
    attentionState: row.attentionState,
    notes: row.notes,
    createdAt: row.createdAt,
  };
}

function transformInvoice(row: any) {
  return {
    id: row.id,
    invoiceNumber: row.invoiceNumber,
    invoiceDate: row.invoiceDate,
    dueDate: row.dueDate,
    clientId: row.clientId,
    clientName: row.client?.name || "",
    clientEmail: row.client?.email,
    projectId: row.projectId,
    projectName: row.project?.projectName,
    lineItems: (row.items || []).map((item: any) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      total: item.total,
    })),
    subtotal: row.subtotal,
    taxRate: row.taxRate,
    taxAmount: row.taxAmount,
    discountAmount: row.discountAmount,
    grandTotal: row.grandTotal,
    paidAmount: row.paidAmount,
    balanceDue: row.balanceDue,
    paymentStatus: row.paymentStatus,
    notes: row.notes,
    createdAt: row.createdAt,
  };
}

function transformSubscription(row: any) {
  return {
    id: row.id,
    projectId: row.projectId,
    toolName: row.toolName,
    platform: row.platform,
    subscriptionType: row.subscriptionType,
    emailId: row.emailId,
    password: row.password,
    startDate: row.startDate,
    endDate: row.endDate,
    cancelByDate: row.cancelByDate,
    cost: row.cost,
    manualStatus: row.manualStatus,
    attentionState: row.attentionState,
    notes: row.notes,
    createdAt: row.createdAt,
  };
}

function transformAction(row: any) {
  return {
    id: row.id,
    text: row.text,
    dueDate: row.dueDate,
    completed: row.completed,
    context: {
      type: row.contextType,
      id: row.contextId,
    },
    createdAt: row.createdAt,
  };
}

function transformLog(row: any) {
  return {
    id: row.id,
    projectId: row.projectId,
    text: row.text,
    createdAt: row.createdAt,
  };
}

function transformBranding(row: any) {
  return {
    businessName: row.businessName,
    tagline: row.tagline,
    logoUrl: row.logoUrl,
    upiQrUrl: row.upiQrUrl,
    upiId: row.upiId,
    mobile: row.mobile,
    address: row.address,
    email: row.email,
  };
}
