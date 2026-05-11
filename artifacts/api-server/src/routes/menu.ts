import { Router, type IRouter } from "express";
import { eq, and, ilike, desc } from "drizzle-orm";
import { db, categoriesTable, menuItemsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/menu/categories", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(categoriesTable)
    .orderBy(categoriesTable.sortOrder, categoriesTable.name);
  res.json(rows);
});

router.get("/menu/items", async (req, res): Promise<void> => {
  const { categoryId, search, featured } = req.query;
  const conditions = [];
  if (categoryId) {
    const idNum = parseInt(String(categoryId), 10);
    if (!Number.isNaN(idNum)) conditions.push(eq(menuItemsTable.categoryId, idNum));
  }
  if (search && typeof search === "string" && search.trim()) {
    conditions.push(ilike(menuItemsTable.name, `%${search.trim()}%`));
  }
  if (featured === "true") {
    conditions.push(eq(menuItemsTable.isFeatured, true));
  }

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
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(menuItemsTable.name);
  res.json(items);
});

router.get("/menu/popular", async (_req, res): Promise<void> => {
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
    .where(eq(menuItemsTable.isFeatured, true))
    .orderBy(desc(menuItemsTable.id))
    .limit(8);
  res.json(items);
});

router.get("/menu/items/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [item] = await db
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
    .where(eq(menuItemsTable.id, id));
  if (!item) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(item);
});

export default router;
