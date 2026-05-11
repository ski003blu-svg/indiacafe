import { Router, type IRouter } from "express";
import { db, locationsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/locations", async (_req, res): Promise<void> => {
  const rows = await db.select().from(locationsTable).orderBy(locationsTable.id);
  res.json(rows);
});

export default router;
