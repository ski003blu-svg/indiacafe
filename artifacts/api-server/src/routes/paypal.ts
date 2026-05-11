import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, ordersTable } from "@workspace/db";
import { ordersController, paypalClientId } from "../lib/paypal";
import { getFullOrder } from "../lib/orderHelpers";

const router: IRouter = Router();

router.get("/paypal/setup", async (_req, res): Promise<void> => {
  res.json({ clientId: paypalClientId });
});

router.post("/paypal/create-order", async (req, res): Promise<void> => {
  const { orderId } = req.body ?? {};
  if (typeof orderId !== "number") {
    res.status(400).json({ error: "orderId required" });
    return;
  }
  const order = await getFullOrder(orderId);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  try {
    const tipNum = Number(order.tipAmount ?? 0);

    const result = await ordersController.createOrder({
      body: {
        intent: "CAPTURE" as never,
        purchaseUnits: [
          {
            referenceId: String(order.id),
            amount: {
              currencyCode: "USD",
              value: order.total,
              breakdown: {
                itemTotal: { currencyCode: "USD", value: order.subtotal },
                taxTotal: { currencyCode: "USD", value: order.tax },
                shipping: { currencyCode: "USD", value: order.deliveryFee },
                handling: { currencyCode: "USD", value: "0.00" },
                insurance: { currencyCode: "USD", value: "0.00" },
                shippingDiscount: { currencyCode: "USD", value: "0.00" },
                discount: { currencyCode: "USD", value: "0.00" },
                ...(tipNum > 0
                  ? { gratuity: { currencyCode: "USD", value: tipNum.toFixed(2) } }
                  : {}),
              },
            },
            description: `India Cafe Order ${order.orderNumber}`,
            customId: order.orderNumber,
            items: order.items.map((it) => ({
              name: it.name.slice(0, 127),
              quantity: String(it.quantity),
              unitAmount: { currencyCode: "USD", value: it.price },
            })),
          },
        ],
      },
    });

    const ppOrder = result.result as { id?: string };
    if (!ppOrder?.id) {
      res.status(500).json({ error: "Failed to create PayPal order" });
      return;
    }

    await db
      .update(ordersTable)
      .set({ paypalOrderId: ppOrder.id })
      .where(eq(ordersTable.id, order.id));

    res.json({ id: ppOrder.id });
  } catch (err) {
    req.log.error({ err }, "PayPal create order failed");
    res.status(500).json({ error: "PayPal create order failed" });
  }
});

router.post(
  "/paypal/capture-order/:paypalOrderId",
  async (req, res): Promise<void> => {
    const raw = Array.isArray(req.params.paypalOrderId)
      ? req.params.paypalOrderId[0]
      : req.params.paypalOrderId;

    const [orderRow] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.paypalOrderId, raw));

    if (!orderRow) {
      res.status(404).json({ error: "Order not found for PayPal id" });
      return;
    }

    try {
      await ordersController.captureOrder({
        id: raw,
        prefer: "return=representation",
      });

      await db
        .update(ordersTable)
        .set({ status: "paid", paymentMethod: "paypal" })
        .where(eq(ordersTable.id, orderRow.id));

      res.json({
        success: true,
        orderId: orderRow.id,
        orderNumber: orderRow.orderNumber,
      });
    } catch (err) {
      req.log.error({ err }, "PayPal capture failed");
      res.status(500).json({ error: "PayPal capture failed" });
    }
  },
);

export default router;
