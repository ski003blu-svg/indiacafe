import {
  Client,
  Environment,
  LogLevel,
  OrdersController,
} from "@paypal/paypal-server-sdk";
import { logger } from "./logger";

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  logger.warn("PayPal credentials not configured");
}

export const paypalClient = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: PAYPAL_CLIENT_ID ?? "",
    oAuthClientSecret: PAYPAL_CLIENT_SECRET ?? "",
  },
  timeout: 0,
  environment:
    process.env.NODE_ENV === "production"
      ? Environment.Production
      : Environment.Sandbox,
  logging: {
    logLevel: LogLevel.Info,
    logRequest: { logBody: false },
    logResponse: { logHeaders: false },
  },
});

export const ordersController = new OrdersController(paypalClient);

export const paypalClientId = PAYPAL_CLIENT_ID ?? "";
