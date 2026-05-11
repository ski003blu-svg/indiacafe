import { db, ordersTable, orderItemsTable, locationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function getFullOrder(id: number) {
  const [order] = await db
    .select({
      id: ordersTable.id,
      orderNumber: ordersTable.orderNumber,
      status: ordersTable.status,
      orderType: ordersTable.orderType,
      locationId: ordersTable.locationId,
      locationName: locationsTable.name,
      customerName: ordersTable.customerName,
      customerEmail: ordersTable.customerEmail,
      customerPhone: ordersTable.customerPhone,
      deliveryAddress: ordersTable.deliveryAddress,
      scheduledFor: ordersTable.scheduledFor,
      notes: ordersTable.notes,
      subtotal: ordersTable.subtotal,
      tax: ordersTable.tax,
      tipAmount: ordersTable.tipAmount,
      deliveryFee: ordersTable.deliveryFee,
      total: ordersTable.total,
      paymentMethod: ordersTable.paymentMethod,
      paypalOrderId: ordersTable.paypalOrderId,
      deliveryPhotoUrl: ordersTable.deliveryPhotoUrl,
      createdAt: ordersTable.createdAt,
      updatedAt: ordersTable.updatedAt,
    })
    .from(ordersTable)
    .leftJoin(locationsTable, eq(ordersTable.locationId, locationsTable.id))
    .where(eq(ordersTable.id, id));
  if (!order) return null;
  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, id))
    .orderBy(orderItemsTable.id);
  return { ...order, items };
}

export function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `IC-${ts}${rand}`;
}
