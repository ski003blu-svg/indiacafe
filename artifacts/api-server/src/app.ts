import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({
  credentials: true,
  origin: [
    "https://indiacafe.pages.dev",
    "http://localhost:5173"
  ]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY) {
  const { clerkMiddleware } = await import("@clerk/express");
  app.use(
    clerkMiddleware((req) => ({
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY ?? "",
      proxyUrl: `https://${getClerkProxyHost(req) ?? ""}${CLERK_PROXY_PATH}`,
    })),
  );
  logger.info("Clerk middleware enabled");
} else {
  logger.warn("CLERK_PUBLISHABLE_KEY or CLERK_SECRET_KEY not set — Clerk middleware disabled");
}

app.use("/api", router);

export default app;
