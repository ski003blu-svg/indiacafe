import { Router, type IRouter } from "express";
import { eq, and, inArray, desc } from "drizzle-orm";
import {
  db,
  ordersTable,
  orderItemsTable,
  menuItemsTable,
} from "@workspace/db";
import { generateOrderNumber, getFullOrder } from "../lib/orderHelpers";
import { sendOrderConfirmationEmail } from "../lib/email";

const router: IRouter = Router();

const TAX_RATE = 0.07;
const DELIVERY_FEE = 4.99;
const DELIVERY_RADIUS_MILES = 10;

// Restaurant locations for radius check
const RESTAURANT_LOCATIONS = [
  { name: "Fairfield", lat: 41.0058, lng: -91.9624 },
  { name: "Iowa City", lat: 41.6611, lng: -91.5302 },
];

function haversineDistanceMiles(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=us`;
    const res = await fetch(url, {
      headers: { "User-Agent": "IndiaCafeApp/1.0 (restaurant ordering)" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { lat: string; lon: string }[];
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

async function isWithinDeliveryRadius(address: string): Promise<{ ok: boolean; error?: string }> {
  const coords = await geocodeAddress(address);
  if (!coords) {
    // Can't verify — allow it but log (don't block)
    return { ok: true };
  }
  const minDist = Math.min(
    ...RESTAURANT_LOCATIONS.map((loc) =>
      haversineDistanceMiles(coords.lat, coords.lng, loc.lat, loc.lng)
    )
  );
  if (minDist > DELIVERY_RADIUS_MILES) {
    return {
      ok: false,
      error: `Sorry, your address is approximately ${minDist.toFixed(1)} miles away. We only deliver within ${DELIVERY_RADIUS_MILES} miles of our locations (Fairfield & Iowa City, IA).`,
    };
  }
  return { ok: true };
}

router.post("/orders", async (req, res): Promise<void> => {
  const body = req.body ?? {};
  const {
    orderType,
    locationId,
    customerName,
    customerEmail,
    customerPhone,
    deliveryAddress,
    scheduledFor,
    notes,
    tipAmount,
    items,
  } = body;

  if (
    !["pickup", "delivery"].includes(orderType) ||
    typeof locationId !== "number" ||
    typeof customerName !== "string" ||
    !customerName.trim() ||
    typeof customerEmail !== "string" ||
    !customerEmail.trim() ||
    typeof customerPhone !== "string" ||
    !customerPhone.trim() ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    res.status(400).json({ error: "Invalid order body" });
    return;
  }

  // 10-mile delivery radius check
  if (orderType === "delivery") {
    if (!deliveryAddress || typeof deliveryAddress !== "string" || !deliveryAddress.trim()) {
      res.status(400).json({ error: "Delivery address is required for delivery orders" });
      return;
    }
    const radiusCheck = await isWithinDeliveryRadius(deliveryAddress.trim());
    if (!radiusCheck.ok) {
      res.status(400).json({ error: radiusCheck.error });
      return;
    }
  }

  const ids = items
    .map((i: { menuItemId: number }) => i.menuItemId)
    .filter((n) => typeof n === "number");
  if (ids.length === 0) {
    res.status(400).json({ error: "No valid items" });
    return;
  }

  const dbItems = await db
    .select()
    .from(menuItemsTable)
    .where(inArray(menuItemsTable.id, ids));
  const itemMap = new Map(dbItems.map((i) => [i.id, i]));

  let subtotal = 0;
  const orderItemsToInsert = items
    .map((i: { menuItemId: number; quantity: number; notes?: string | null }) => {
      const m = itemMap.get(i.menuItemId);
      if (!m) return null;
      const qty = Math.max(1, Math.round(i.quantity ?? 1));
      const lineTotal = Number(m.price) * qty;
      subtotal += lineTotal;
      return {
        menuItemId: m.id,
        name: m.name,
        price: m.price,
        quantity: qty,
        notes: i.notes ?? null,
      };
    })
    .filter(<T,>(x: T): x is NonNullable<T> => x !== null);

  if (orderItemsToInsert.length === 0) {
    res.status(400).json({ error: "No matching menu items" });
    return;
  }

  const tipNum = Math.max(0, Number(tipAmount ?? 0)) || 0;
  const fee = orderType === "delivery" ? DELIVERY_FEE : 0;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax + tipNum + fee;

  const [created] = await db
    .insert(ordersTable)
    .values({
      orderNumber: generateOrderNumber(),
      status: "pending_payment",
      orderType,
      locationId,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      customerPhone: customerPhone.trim(),
      deliveryAddress:
        orderType === "delivery" && typeof deliveryAddress === "string"
          ? deliveryAddress.trim()
          : null,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      notes: typeof notes === "string" ? notes : null,
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      tipAmount: tipNum.toFixed(2),
      deliveryFee: fee.toFixed(2),
      total: total.toFixed(2),
    })
    .returning();

  await db
    .insert(orderItemsTable)
    .values(orderItemsToInsert.map((i) => ({ ...i, orderId: created.id })));

  const full = await getFullOrder(created.id);

  // Send confirmation email (fire-and-forget)
  if (full) {
    sendOrderConfirmationEmail({
      customerName: full.customerName,
      customerEmail: full.customerEmail,
      orderNumber: full.orderNumber,
      orderType: full.orderType,
      locationName: full.locationName,
      deliveryAddress: full.deliveryAddress,
      subtotal: full.subtotal,
      tax: full.tax,
      tipAmount: full.tipAmount,
      deliveryFee: full.deliveryFee,
      total: full.total,
      items: full.items,
    }).catch(() => {});
  }

  res.status(201).json(full);
});

// Delivery person photo submission (public endpoint — authenticated by order number)
router.post("/orders/:orderNumber/delivery-photo", async (req, res): Promise<void> => {
  const { orderNumber } = req.params;
  const { photoDataUrl } = req.body ?? {};

  if (typeof orderNumber !== "string" || !orderNumber.trim()) {
    res.status(400).json({ error: "Invalid order number" });
    return;
  }

  if (typeof photoDataUrl !== "string" || !photoDataUrl.startsWith("data:image/")) {
    res.status(400).json({ error: "Invalid photo — must be a base64 data URL (data:image/...)" });
    return;
  }

  // Limit to ~5MB base64
  if (photoDataUrl.length > 7_000_000) {
    res.status(400).json({ error: "Photo too large (max ~5 MB)" });
    return;
  }

  const [order] = await db
    .select({ id: ordersTable.id, status: ordersTable.status })
    .from(ordersTable)
    .where(eq(ordersTable.orderNumber, orderNumber.trim()));

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  await db
    .update(ordersTable)
    .set({ deliveryPhotoUrl: photoDataUrl })
    .where(eq(ordersTable.id, order.id));

  res.json({ success: true });
});

router.get("/orders/by-email", async (req, res): Promise<void> => {
  const { email } = req.query;
  if (typeof email !== "string" || !email.trim()) {
    res.status(400).json({ error: "Missing email parameter" });
    return;
  }
  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.customerEmail, email.trim().toLowerCase()))
    .orderBy(desc(ordersTable.createdAt));

  const full = await Promise.all(orders.map((o) => getFullOrder(o.id)));
  res.json(full.filter(Boolean));
});

router.get("/orders/lookup", async (req, res): Promise<void> => {
  const { orderNumber, email } = req.query;
  if (
    typeof orderNumber !== "string" ||
    !orderNumber.trim() ||
    typeof email !== "string" ||
    !email.trim()
  ) {
    res.status(400).json({ error: "Missing orderNumber or email" });
    return;
  }
  const [match] = await db
    .select()
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.orderNumber, orderNumber.trim()),
        eq(ordersTable.customerEmail, email.trim().toLowerCase()),
      ),
    );
  if (!match) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const full = await getFullOrder(match.id);
  res.json(full);
});

router.get("/orders/:id", async (req, res): Promise<void> => {
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
});

export default router;
