import { Router, type IRouter } from "express";
import { eq, desc, sql, and, gte, inArray } from "drizzle-orm";
import {
  db,
  ordersTable,
  orderItemsTable,
  menuItemsTable,
  categoriesTable,
  contactMessagesTable,
  testimonialsTable,
  locationsTable,
} from "@workspace/db";
import {
  verifyPassword,
  issueToken,
  requireAdmin,
} from "../lib/adminAuth";
import { getFullOrder } from "../lib/orderHelpers";
import { sendOrderStatusEmail } from "../lib/email";

const router: IRouter = Router();

router.post("/admin/login", async (req, res): Promise<void> => {
  const { password } = req.body ?? {};
  if (typeof password !== "string" || !verifyPassword(password)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  res.json({ token: issueToken() });
});

router.get("/admin/me", requireAdmin, async (_req, res): Promise<void> => {
  res.json({ authenticated: true });
});

router.get(
  "/admin/dashboard",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const [todayAgg] = await db
      .select({
        cnt: sql<number>`count(*)::int`,
        rev: sql<string>`coalesce(sum(${ordersTable.total}),0)::text`,
      })
      .from(ordersTable)
      .where(
        and(
          gte(ordersTable.createdAt, startOfDay),
          inArray(ordersTable.status, [
            "paid",
            "preparing",
            "ready",
            "completed",
          ]),
        ),
      );

    const [weekAgg] = await db
      .select({
        cnt: sql<number>`count(*)::int`,
        rev: sql<string>`coalesce(sum(${ordersTable.total}),0)::text`,
      })
      .from(ordersTable)
      .where(
        and(
          gte(ordersTable.createdAt, startOfWeek),
          inArray(ordersTable.status, [
            "paid",
            "preparing",
            "ready",
            "completed",
          ]),
        ),
      );

    const statusBreakdown = await db
      .select({
        status: ordersTable.status,
        count: sql<number>`count(*)::int`,
      })
      .from(ordersTable)
      .groupBy(ordersTable.status);

    const [{ totalMenuItems }] = await db
      .select({ totalMenuItems: sql<number>`count(*)::int` })
      .from(menuItemsTable);

    const [{ totalCustomers }] = await db
      .select({
        totalCustomers: sql<number>`count(distinct ${ordersTable.customerEmail})::int`,
      })
      .from(ordersTable);

    const recent = await db
      .select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt))
      .limit(8);

    const recentOrders = await Promise.all(
      recent.map((o) => getFullOrder(o.id)),
    );

    const top = await db
      .select({
        menuItemId: orderItemsTable.menuItemId,
        name: orderItemsTable.name,
        quantity: sql<number>`sum(${orderItemsTable.quantity})::int`,
        revenue: sql<string>`(sum(${orderItemsTable.quantity} * ${orderItemsTable.price}))::text`,
      })
      .from(orderItemsTable)
      .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
      .where(
        inArray(ordersTable.status, [
          "paid",
          "preparing",
          "ready",
          "completed",
        ]),
      )
      .groupBy(orderItemsTable.menuItemId, orderItemsTable.name)
      .orderBy(desc(sql`sum(${orderItemsTable.quantity})`))
      .limit(5);

    const counts = (status: string) =>
      statusBreakdown.find((s) => s.status === status)?.count ?? 0;

    res.json({
      ordersToday: todayAgg.cnt,
      revenueToday: todayAgg.rev,
      ordersThisWeek: weekAgg.cnt,
      revenueThisWeek: weekAgg.rev,
      pendingOrders: counts("pending_payment"),
      preparingOrders: counts("preparing"),
      readyOrders: counts("ready"),
      totalMenuItems,
      totalCustomers,
      statusBreakdown,
      recentOrders: recentOrders.filter(Boolean),
      topItems: top,
    });
  },
);

router.get(
  "/admin/orders",
  requireAdmin,
  async (req, res): Promise<void> => {
    const { status, orderType } = req.query;
    const conditions = [];
    if (typeof status === "string" && status) {
      conditions.push(eq(ordersTable.status, status));
    }
    if (typeof orderType === "string" && orderType) {
      conditions.push(eq(ordersTable.orderType, orderType));
    }
    const list = await db
      .select()
      .from(ordersTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(ordersTable.createdAt))
      .limit(200);
    const full = await Promise.all(list.map((o) => getFullOrder(o.id)));
    res.json(full.filter(Boolean));
  },
);

router.get(
  "/admin/orders/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const full = await getFullOrder(id);
    if (!full) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(full);
  },
);

router.patch(
  "/admin/orders/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const { status } = req.body ?? {};
    if (typeof status !== "string") {
      res.status(400).json({ error: "Invalid body" });
      return;
    }
    const allowed = [
      "pending_payment",
      "paid",
      "preparing",
      "ready",
      "completed",
      "cancelled",
    ];
    if (!allowed.includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    await db
      .update(ordersTable)
      .set({ status })
      .where(eq(ordersTable.id, id));
    const full = await getFullOrder(id);
    if (!full) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    // Send status update email (fire-and-forget)
    sendOrderStatusEmail({
      customerName: full.customerName,
      customerEmail: full.customerEmail,
      orderNumber: full.orderNumber,
      orderType: full.orderType,
      locationName: full.locationName,
      deliveryAddress: full.deliveryAddress,
      status: full.status,
      subtotal: full.subtotal,
      tax: full.tax,
      tipAmount: full.tipAmount,
      deliveryFee: full.deliveryFee,
      total: full.total,
      items: full.items,
    }).catch(() => {});
    res.json(full);
  },
);

router.get(
  "/admin/menu/items",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const items = await db
      .select({
        id: menuItemsTable.id,
        name: menuItemsTable.name,
        description: menuItemsTable.description,
        price: menuItemsTable.price,
        imageUrl: menuItemsTable.imageUrl,
        categoryId: menuItemsTable.categoryId,
        categoryName: categoriesTable.name,
        isVegetarian: menuItemsTable.isVegetarian,
        isVegan: menuItemsTable.isVegan,
        isGlutenFree: menuItemsTable.isGlutenFree,
        spiceLevel: menuItemsTable.spiceLevel,
        isAvailable: menuItemsTable.isAvailable,
        isFeatured: menuItemsTable.isFeatured,
      })
      .from(menuItemsTable)
      .leftJoin(
        categoriesTable,
        eq(menuItemsTable.categoryId, categoriesTable.id),
      )
      .orderBy(desc(menuItemsTable.id));
    res.json(items);
  },
);

router.post(
  "/admin/menu/items",
  requireAdmin,
  async (req, res): Promise<void> => {
    const b = req.body ?? {};
    if (
      typeof b.name !== "string" ||
      typeof b.description !== "string" ||
      typeof b.price !== "string" ||
      typeof b.categoryId !== "number"
    ) {
      res.status(400).json({ error: "Invalid body" });
      return;
    }
    const [created] = await db
      .insert(menuItemsTable)
      .values({
        name: b.name,
        description: b.description,
        price: b.price,
        imageUrl: b.imageUrl ?? null,
        categoryId: b.categoryId,
        isVegetarian: !!b.isVegetarian,
        isVegan: !!b.isVegan,
        isGlutenFree: !!b.isGlutenFree,
        spiceLevel: typeof b.spiceLevel === "number" ? b.spiceLevel : 0,
        isAvailable: b.isAvailable !== false,
        isFeatured: !!b.isFeatured,
      })
      .returning();
    res.status(201).json(created);
  },
);

router.patch(
  "/admin/menu/items/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    const b = req.body ?? {};
    const updates: Record<string, unknown> = {};
    for (const k of [
      "name",
      "description",
      "price",
      "imageUrl",
      "categoryId",
      "isVegetarian",
      "isVegan",
      "isGlutenFree",
      "spiceLevel",
      "isAvailable",
      "isFeatured",
    ]) {
      if (b[k] !== undefined) updates[k] = b[k];
    }
    const [updated] = await db
      .update(menuItemsTable)
      .set(updates)
      .where(eq(menuItemsTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(updated);
  },
);

router.delete(
  "/admin/menu/items/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    await db.delete(menuItemsTable).where(eq(menuItemsTable.id, id));
    res.sendStatus(204);
  },
);

router.post(
  "/admin/menu/categories",
  requireAdmin,
  async (req, res): Promise<void> => {
    const b = req.body ?? {};
    if (typeof b.name !== "string" || typeof b.slug !== "string") {
      res.status(400).json({ error: "Invalid body" });
      return;
    }
    const [created] = await db
      .insert(categoriesTable)
      .values({
        name: b.name,
        slug: b.slug,
        sortOrder: typeof b.sortOrder === "number" ? b.sortOrder : 0,
      })
      .returning();
    res.status(201).json(created);
  },
);

router.delete(
  "/admin/menu/categories/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    res.sendStatus(204);
  },
);

router.get(
  "/admin/contact",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(contactMessagesTable)
      .orderBy(desc(contactMessagesTable.createdAt));
    res.json(rows);
  },
);

router.get(
  "/admin/testimonials",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(testimonialsTable)
      .orderBy(desc(testimonialsTable.createdAt));
    res.json(rows);
  },
);

router.patch(
  "/admin/testimonials/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    const b = req.body ?? {};
    const [updated] = await db
      .update(testimonialsTable)
      .set({ isApproved: !!b.isApproved })
      .where(eq(testimonialsTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(updated);
  },
);

router.delete(
  "/admin/testimonials/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    await db.delete(testimonialsTable).where(eq(testimonialsTable.id, id));
    res.sendStatus(204);
  },
);

// Silence unused import lint
void locationsTable;

export default router;
