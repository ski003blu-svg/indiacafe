import nodemailer from "nodemailer";
import { logger } from "./logger";

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

const FROM_ADDRESS =
  process.env.SMTP_FROM ?? "India Cafe <orders@indiacafe.com>";

interface OrderEmailData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  orderType: string;
  locationName?: string | null;
  deliveryAddress?: string | null;
  status?: string;
  subtotal: string;
  tax: string;
  tipAmount: string;
  deliveryFee: string;
  total: string;
  items: { name: string; quantity: number; price: string }[];
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    pending_payment: "Pending Payment",
    paid: "Payment Confirmed",
    preparing: "Being Prepared",
    ready: "Ready for Pickup / Out for Delivery",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return map[status] ?? status;
}

function buildOrderSummaryHtml(order: OrderEmailData): string {
  const rows = order.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:6px 0;border-bottom:1px solid #f0f0f0">${i.name} × ${i.quantity}</td>
          <td style="padding:6px 0;border-bottom:1px solid #f0f0f0;text-align:right">$${(Number(i.price) * i.quantity).toFixed(2)}</td>
        </tr>`,
    )
    .join("");

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e5e5;border-radius:12px;overflow:hidden">
      <div style="background:#e8541a;padding:32px;text-align:center">
        <h1 style="margin:0;color:#fff;font-size:24px">India Cafe</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">Authentic Indian Cuisine</p>
      </div>
      <div style="padding:32px">
        <h2 style="margin:0 0 8px;color:#111">Order #${order.orderNumber}</h2>
        <p style="margin:0 0 24px;color:#555;font-size:14px">
          ${order.orderType === "delivery" ? "Delivery" : "Pickup"} •
          ${order.locationName ?? ""}
          ${order.deliveryAddress ? ` • ${order.deliveryAddress}` : ""}
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#333">
          ${rows}
        </table>
        <div style="margin-top:16px;text-align:right;font-size:14px;color:#555">
          <div>Subtotal: $${Number(order.subtotal).toFixed(2)}</div>
          <div>Tax: $${Number(order.tax).toFixed(2)}</div>
          ${Number(order.deliveryFee) > 0 ? `<div>Delivery Fee: $${Number(order.deliveryFee).toFixed(2)}</div>` : ""}
          ${Number(order.tipAmount) > 0 ? `<div>Tip: $${Number(order.tipAmount).toFixed(2)}</div>` : ""}
          <div style="font-size:18px;font-weight:bold;color:#111;margin-top:8px">Total: $${Number(order.total).toFixed(2)}</div>
        </div>
      </div>
      <div style="background:#fafafa;padding:16px 32px;text-align:center;font-size:12px;color:#888">
        Questions? Call us or reply to this email.<br>
        Thank you for choosing India Cafe!
      </div>
    </div>`;
}

export async function sendOrderConfirmationEmail(
  order: OrderEmailData,
): Promise<void> {
  const subject = `Order Confirmed — #${order.orderNumber} | India Cafe`;
  const html = `
    <p style="font-family:sans-serif;color:#333;margin:0 0 24px">
      Hi ${order.customerName}, thank you for your order! We've received it and will start preparing it shortly.
    </p>
    ${buildOrderSummaryHtml(order)}`;

  await sendEmail(order.customerEmail, subject, html);
}

export async function sendOrderStatusEmail(
  order: OrderEmailData,
): Promise<void> {
  const statusLabel = formatStatus(order.status ?? "");
  const subject = `Order Update — #${order.orderNumber} is ${statusLabel} | India Cafe`;
  const html = `
    <p style="font-family:sans-serif;color:#333;margin:0 0 24px">
      Hi ${order.customerName}, your order <strong>#${order.orderNumber}</strong> status has been updated to:
      <strong style="color:#e8541a">${statusLabel}</strong>.
    </p>
    ${buildOrderSummaryHtml(order)}`;

  await sendEmail(order.customerEmail, subject, html);
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const transport = createTransport();
  if (!transport) {
    logger.info(
      { to, subject },
      "[Email] SMTP not configured — would have sent email",
    );
    return;
  }
  try {
    await transport.sendMail({ from: FROM_ADDRESS, to, subject, html });
    logger.info({ to, subject }, "[Email] Sent");
  } catch (err) {
    logger.error({ err, to, subject }, "[Email] Failed to send");
  }
}
