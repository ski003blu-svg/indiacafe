import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, testimonialsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/testimonials", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(testimonialsTable)
    .where(eq(testimonialsTable.isApproved, true))
    .orderBy(desc(testimonialsTable.createdAt));
  res.json(rows);
});

router.post("/testimonials", async (req, res): Promise<void> => {
  const { name, rating, message } = req.body ?? {};
  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof rating !== "number" ||
    typeof message !== "string" ||
    !message.trim()
  ) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const [row] = await db
    .insert(testimonialsTable)
    .values({
      name: name.trim(),
      rating: Math.max(1, Math.min(5, Math.round(rating))),
      message: message.trim(),
      isApproved: false,
    })
    .returning();
  res.status(201).json(row);
});

export default router;
