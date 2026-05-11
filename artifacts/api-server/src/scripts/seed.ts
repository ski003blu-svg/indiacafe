/**
 * Full India Cafe seed — real menu from menu photos + Cloudinary image uploads.
 * Run:  pnpm --filter @workspace/api-server run seed
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ── 1. Load .env BEFORE any @workspace/db import (db reads DATABASE_URL at module load) ──
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const _req = createRequire(import.meta.url);
const dotenv = _req("dotenv") as typeof import("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../../.env"), override: true });

// ── 2. Cloudinary (upload images once, re-use URLs) ──────────────────────────
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  api_key: process.env.CLOUDINARY_API_KEY ?? "",
  api_secret: process.env.CLOUDINARY_API_SECRET ?? "",
});

/**
 * Upload a source URL to Cloudinary using a stable public_id so re-runs are idempotent.
 * Falls back to the source URL if cloudinary is not configured.
 */
async function cdn(publicId: string, sourceUrl: string): Promise<string> {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    return sourceUrl;
  }
  try {
    const result = await cloudinary.uploader.upload(sourceUrl, {
      public_id: `india-cafe/menu/${publicId}`,
      overwrite: false,
      resource_type: "image",
    });
    return result.secure_url;
  } catch {
    return sourceUrl;
  }
}

// ── 3. Image source map (Unsplash → Cloudinary) ──────────────────────────────
const IMG: Record<string, string> = {};

async function buildImages() {
  const sources: Record<string, string> = {
    samosa:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80",
    pakora:
      "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&q=80",
    platter:
      "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80",
    soup: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80",
    naan: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80",
    "garlic-naan":
      "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&q=80",
    paratha:
      "https://images.unsplash.com/photo-1626500155398-d61b8954f4f6?w=800&q=80",
    dal: "https://images.unsplash.com/photo-1626500155398-d61b8954f4f6?w=800&q=80",
    "saag-paneer":
      "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&q=80",
    "paneer-makhani":
      "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&q=80",
    "aloo-gobi":
      "https://images.unsplash.com/photo-1584188219082-6a34432b1c45?w=800&q=80",
    "chana-masala":
      "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&q=80",
    "malai-kofta":
      "https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=80",
    "paneer-tikka":
      "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&q=80",
    "tandoori-chicken":
      "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&q=80",
    "chicken-tikka":
      "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80",
    shrimp:
      "https://images.unsplash.com/photo-1606471191009-63f1670e9d3c?w=800&q=80",
    kebab:
      "https://images.unsplash.com/photo-1633237308525-cd587cf71926?w=800&q=80",
    "butter-chicken":
      "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&q=80",
    "chicken-tikka-masala":
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80",
    "chicken-curry":
      "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&q=80",
    "lamb-rogan":
      "https://images.unsplash.com/photo-1545247181-516773cae754?w=800&q=80",
    "lamb-curry":
      "https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=80",
    "fish-masala":
      "https://images.unsplash.com/photo-1626777553635-a5cd1b41b6f6?w=800&q=80",
    biryani:
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80",
    "veg-biryani":
      "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&q=80",
    rice: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&q=80",
    yogurt:
      "https://images.unsplash.com/photo-1587309834582-9f5ef94bb84a?w=800&q=80",
    salad:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
    chutney:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
    "gulab-jamun":
      "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&q=80",
    "rice-pudding":
      "https://images.unsplash.com/photo-1541533848490-bc8115cd6522?w=800&q=80",
    halwa:
      "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&q=80",
    "mango-lassi":
      "https://images.unsplash.com/photo-1587899897387-091ebd01a6b2?w=800&q=80",
    chai: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=800&q=80",
    juice:
      "https://images.unsplash.com/photo-1546173159-315724a31696?w=800&q=80",
    vindaloo:
      "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&q=80",
    "mixed-grill":
      "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&q=80",
    bhindi:
      "https://images.unsplash.com/photo-1576021182211-9ea8dced3690?w=800&q=80",
  };

  console.log(`Uploading ${Object.keys(sources).length} images to Cloudinary…`);
  for (const [key, url] of Object.entries(sources)) {
    IMG[key] = await cdn(key, url);
    process.stdout.write(".");
  }
  console.log("\nImages ready.");
}

// ── 4. Seed ────────────────────────────────────────────────────────────────
async function main() {
  // Dynamic import so DATABASE_URL is already set before the pool is created
  const {
    db,
    locationsTable,
    categoriesTable,
    menuItemsTable,
    testimonialsTable,
    orderItemsTable,
    ordersTable,
  } = await import("@workspace/db");

  console.log("India Cafe full seed starting…");

  await buildImages();

  // ── Clear existing data ────────────────────────────────────────────────
  console.log("Clearing existing data…");
  await db.delete(orderItemsTable);
  await db.delete(ordersTable);
  await db.delete(menuItemsTable);
  await db.delete(categoriesTable);
  await db.delete(testimonialsTable);
  await db.delete(locationsTable);
  console.log("Cleared.");

  // ── Locations ──────────────────────────────────────────────────────────
  await db.insert(locationsTable).values([
    {
      name: "Fairfield",
      address: "50 W Burlington Ave, Fairfield, IA 52558",
      phone: "+1 641-472-1792",
      hours:
        "Lunch 11:30 AM – 2:30 PM (Buffet & Carryout) | Dinner 5:00 PM – 9:30 PM (Dine In & Carryout) | Closed Thursdays",
      latitude: 41.0058,
      longitude: -91.9624,
    },
    {
      name: "Iowa City",
      address: "227 E Washington St, Iowa City, IA 52240",
      phone: "+1 319-354-2775",
      hours:
        "Lunch 11:00 AM – 2:30 PM (Buffet, Carryout & Delivery) | Dinner 5:00 PM – 9:00 PM (Dine In, Carryout & Delivery)",
      latitude: 41.6611,
      longitude: -91.5302,
    },
  ]);
  console.log("Seeded locations.");

  // ── Categories ─────────────────────────────────────────────────────────
  const cats = await db
    .insert(categoriesTable)
    .values([
      { name: "Vegetarian Appetizers", slug: "veg-appetizers", sortOrder: 1 },
      { name: "Non-Veg Appetizers", slug: "nonveg-appetizers", sortOrder: 2 },
      { name: "Soups", slug: "soups", sortOrder: 3 },
      { name: "Classic Indian Breads", slug: "breads", sortOrder: 4 },
      { name: "Vegetarian", slug: "vegetarian", sortOrder: 5 },
      { name: "Tandoori Specialties", slug: "tandoori", sortOrder: 6 },
      { name: "Chicken", slug: "chicken", sortOrder: 7 },
      { name: "Lamb", slug: "lamb", sortOrder: 8 },
      { name: "Goat", slug: "goat", sortOrder: 9 },
      { name: "Seafood", slug: "seafood", sortOrder: 10 },
      { name: "Rice Specialties", slug: "biryani", sortOrder: 11 },
      { name: "Sides", slug: "sides", sortOrder: 12 },
      { name: "Desserts", slug: "desserts", sortOrder: 13 },
      { name: "Beverages", slug: "beverages", sortOrder: 14 },
    ])
    .returning();
  console.log("Seeded categories.");

  const cid = (slug: string) => cats.find((c) => c.slug === slug)!.id;

  // ── Menu Items ─────────────────────────────────────────────────────────
  await db.insert(menuItemsTable).values([
    // ── VEGETARIAN APPETIZERS ─────────────────────────────────────────
    {
      name: "Papudum",
      description: "Spiced crispy wafers — light and airy, made from lentil flour.",
      price: "1.99",
      categoryId: cid("veg-appetizers"),
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      spiceLevel: 1,
      imageUrl: IMG["samosa"],
    },
    {
      name: "Vegetable Samosa",
      description:
        "Crispy pastry shells stuffed with mild spiced potatoes and green peas. Served with mint and tamarind chutneys.",
      price: "3.99",
      categoryId: cid("veg-appetizers"),
      isVegetarian: true,
      isVegan: true,
      spiceLevel: 1,
      isFeatured: true,
      imageUrl: IMG["samosa"],
    },
    {
      name: "Cheese Pakora",
      description: "Homemade curd cheese battered in spiced gram flour and deep fried to a golden crisp.",
      price: "8.49",
      categoryId: cid("veg-appetizers"),
      isVegetarian: true,
      spiceLevel: 1,
      imageUrl: IMG["pakora"],
    },
    {
      name: "Mix Pakora",
      description: "Assortment of fresh vegetables dipped in spiced chickpea batter and deep fried.",
      price: "5.99",
      categoryId: cid("veg-appetizers"),
      isVegetarian: true,
      isVegan: true,
      spiceLevel: 2,
      imageUrl: IMG["pakora"],
    },
    {
      name: "Palak Pakora",
      description: "Fresh spinach leaves dipped in spiced gram flour batter, battered and fried until crisp.",
      price: "5.99",
      categoryId: cid("veg-appetizers"),
      isVegetarian: true,
      isVegan: true,
      spiceLevel: 1,
      imageUrl: IMG["pakora"],
    },
    {
      name: "Vegetable Platter",
      description:
        "Combination of Vegetable Samosa, Batata Wada Mix, Pakora and Papudum. Perfect for sharing.",
      price: "9.99",
      categoryId: cid("veg-appetizers"),
      isVegetarian: true,
      isVegan: true,
      spiceLevel: 1,
      imageUrl: IMG["platter"],
    },

    // ── NON-VEG APPETIZERS ────────────────────────────────────────────
    {
      name: "Keema Samosa",
      description: "Crisp pastry shells stuffed with seasoned ground lamb and deep fried to a golden crunch.",
      price: "8.99",
      categoryId: cid("nonveg-appetizers"),
      spiceLevel: 2,
      imageUrl: IMG["samosa"],
    },
    {
      name: "Chicken Pakora",
      description: "Boneless chicken pieces spiced, dipped in butter and deep fried until golden.",
      price: "8.99",
      categoryId: cid("nonveg-appetizers"),
      spiceLevel: 2,
      isFeatured: true,
      imageUrl: IMG["pakora"],
    },
    {
      name: "Fish Pakora",
      description: "Boneless fish fillets dipped in spiced batter and deep fried until perfectly crisp.",
      price: "8.99",
      categoryId: cid("nonveg-appetizers"),
      spiceLevel: 2,
      imageUrl: IMG["pakora"],
    },
    {
      name: "Non Vegetarian Platter",
      description: "Generous combination of Keema Samosa, Chicken Pakora, and Papudum. Served with chutneys.",
      price: "13.99",
      categoryId: cid("nonveg-appetizers"),
      spiceLevel: 2,
      imageUrl: IMG["platter"],
    },

    // ── SOUPS ─────────────────────────────────────────────────────────
    {
      name: "Milligatawny Soup",
      description: "Lightly spiced lentil and vegetable soup — a classic Anglo-Indian comfort soup.",
      price: "5.99",
      categoryId: cid("soups"),
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      spiceLevel: 1,
      imageUrl: IMG["soup"],
    },
    {
      name: "Chicken Soup",
      description: "Our Chef's recipe of tender boneless chicken soup with oriental spices.",
      price: "6.99",
      categoryId: cid("soups"),
      isGlutenFree: true,
      spiceLevel: 1,
      imageUrl: IMG["soup"],
    },

    // ── CLASSIC INDIAN BREADS ─────────────────────────────────────────
    {
      name: "Tandoori Roti",
      description: "Indian whole wheat bread baked fresh in the clay tandoor oven.",
      price: "3.25",
      categoryId: cid("breads"),
      isVegetarian: true,
      isVegan: true,
      spiceLevel: 0,
      imageUrl: IMG["naan"],
    },
    {
      name: "Naan",
      description: "Indian fine flour bread, soft and puffy, baked in the tandoor.",
      price: "3.25",
      categoryId: cid("breads"),
      isVegetarian: true,
      spiceLevel: 0,
      isFeatured: true,
      imageUrl: IMG["naan"],
    },
    {
      name: "Garlic Naan",
      description: "Special Naan stuffed with fresh garlic and herb butter.",
      price: "4.25",
      categoryId: cid("breads"),
      isVegetarian: true,
      spiceLevel: 0,
      isFeatured: true,
      imageUrl: IMG["garlic-naan"],
    },
    {
      name: "Kabuli Naan",
      description: "Special Naan stuffed with herbs, nuts and raisins for a sweet-savory bite.",
      price: "4.99",
      categoryId: cid("breads"),
      isVegetarian: true,
      spiceLevel: 0,
      imageUrl: IMG["garlic-naan"],
    },
    {
      name: "Puri",
      description: "Soft, puffy deep-fried wheat bread — a North Indian classic.",
      price: "3.25",
      categoryId: cid("breads"),
      isVegetarian: true,
      isVegan: true,
      spiceLevel: 0,
      imageUrl: IMG["naan"],
    },
    {
      name: "Bhatura",
      description: "Deep-fried fine flour bread, light and fluffy. Best enjoyed with Chana Masala.",
      price: "3.25",
      categoryId: cid("breads"),
      isVegetarian: true,
      spiceLevel: 0,
      imageUrl: IMG["naan"],
    },
    {
      name: "Alo Paratha",
      description: "Whole wheat flatbread stuffed with seasoned mashed potatoes and herbs.",
      price: "5.25",
      categoryId: cid("breads"),
      isVegetarian: true,
      isVegan: true,
      spiceLevel: 1,
      imageUrl: IMG["paratha"],
    },
    {
      name: "Paneer Paratha",
      description: "Layered whole wheat bread stuffed with spiced crumbled homemade cheese.",
      price: "5.99",
      categoryId: cid("breads"),
      isVegetarian: true,
      spiceLevel: 1,
      imageUrl: IMG["paratha"],
    },
    {
      name: "Onion Kulcha",
      description: "Fine flour leavened bread stuffed with spicy caramelized onions.",
      price: "3.99",
      categoryId: cid("breads"),
      isVegetarian: true,
      spiceLevel: 1,
      imageUrl: IMG["paratha"],
    },

    // ── VEGETARIAN (served with Rice) ─────────────────────────────────
    {
      name: "Sag Paneer",
      description:
        "A classic North Indian dish — homemade cheese cubes simmered in a velvety, garlicky spinach gravy.",
      price: "13.99",
      categoryId: cid("vegetarian"),
      isVegetarian: true,
      isGlutenFree: true,
      spiceLevel: 1,
      isFeatured: true,
      imageUrl: IMG["saag-paneer"],
    },
    {
      name: "Channa Saag",
      description: "Chickpeas and spinach cooked together in a light vegetable sauce. Nutritious and flavorful.",
      price: "12.99",
      categoryId: cid("vegetarian"),
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["saag-paneer"],
    },
    {
      name: "Paneer Makhani",
      description: "Homemade cheese cubes simmered in a rich, creamy fresh tomato and butter sauce.",
      price: "15.99",
      categoryId: cid("vegetarian"),
      isVegetarian: true,
      isGlutenFree: true,
      spiceLevel: 1,
      isFeatured: true,
      imageUrl: IMG["paneer-makhani"],
    },
    {
      name: "Matar Paneer",
      description:
        "Fresh green peas and deep-fried homemade curd cheese in a creamy white sauce with nuts.",
      price: "13.99",
      categoryId: cid("vegetarian"),
      isVegetarian: true,
      isGlutenFree: true,
      spiceLevel: 1,
      imageUrl: IMG["paneer-makhani"],
    },
    {
      name: "Alu Gobhi",
      description: "Fresh cauliflower and potato cubes sautéed with cumin, turmeric, and fresh herbs.",
      price: "13.99",
      categoryId: cid("vegetarian"),
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      spiceLevel: 1,
      imageUrl: IMG["aloo-gobi"],
    },
    {
      name: "Chana Masala",
      description:
        "Chickpeas, potatoes, and fresh tomatoes cooked with a tangy dry sauce in Punjabi style.",
      price: "12.99",
      categoryId: cid("vegetarian"),
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["chana-masala"],
    },
    {
      name: "Bengan Bartha",
      description:
        "Roasted eggplant cooked tenderly with tomatoes, green peas, and fresh spices.",
      price: "13.99",
      categoryId: cid("vegetarian"),
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["aloo-gobi"],
    },
    {
      name: "Dal Makhani",
      description:
        "Black-eye beans slow-cooked with butter and cream in a special aromatic sauce.",
      price: "12.99",
      categoryId: cid("vegetarian"),
      isVegetarian: true,
      isGlutenFree: true,
      spiceLevel: 1,
      isFeatured: true,
      imageUrl: IMG["dal"],
    },
    {
      name: "Kadhi Pakora",
      description:
        "Gram flour dumplings in a tangy yogurt and spice gravy — a North Indian home-cooking classic.",
      price: "12.99",
      categoryId: cid("vegetarian"),
      isVegetarian: true,
      spiceLevel: 1,
      imageUrl: IMG["saag-paneer"],
    },
    {
      name: "Mung Dal",
      description: "Yellow lentils cooked with aromatic oriental spices. Simple, wholesome, and delicious.",
      price: "12.99",
      categoryId: cid("vegetarian"),
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      spiceLevel: 1,
      imageUrl: IMG["dal"],
    },
    {
      name: "Bhindi Masala",
      description: "Moderately spiced okra cooked with potatoes and onions in a dry masala.",
      price: "13.99",
      categoryId: cid("vegetarian"),
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["bhindi"],
    },
    {
      name: "Vegetable Jalfrazi",
      description:
        "Fresh mixed vegetables cooked with spices, fresh onion, green peppers, garlic, herbs, and spices.",
      price: "12.99",
      categoryId: cid("vegetarian"),
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["bhindi"],
    },
    {
      name: "Navrttan Korma",
      description: "Nine vegetables with homemade cheese and nuts in a mild, rich creamy sauce.",
      price: "13.99",
      categoryId: cid("vegetarian"),
      isVegetarian: true,
      isGlutenFree: true,
      spiceLevel: 1,
      imageUrl: IMG["paneer-makhani"],
    },
    {
      name: "Malai Kofta",
      description: "Deep-fried vegetable and cheese dumplings simmered in a rich, creamy cashew sauce.",
      price: "13.99",
      categoryId: cid("vegetarian"),
      isVegetarian: true,
      isGlutenFree: true,
      spiceLevel: 1,
      isFeatured: true,
      imageUrl: IMG["malai-kofta"],
    },
    {
      name: "Paneer Tikka",
      description:
        "Homemade cheese, bell pepper, onion, and tomato marinated in mild spices and grilled in the tandoor.",
      price: "19.99",
      categoryId: cid("vegetarian"),
      isVegetarian: true,
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["paneer-tikka"],
    },
    {
      name: "Tofu Tikka",
      description:
        "Tofu, bell pepper, onion, and tomato marinated in mild spices and grilled in the tandoor.",
      price: "15.99",
      categoryId: cid("vegetarian"),
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["paneer-tikka"],
    },

    // ── TANDOORI SPECIALTIES ──────────────────────────────────────────
    {
      name: "Tandoori Chicken",
      description:
        "Chicken marinated in yogurt, ginger herbs, and aromatic spices, then roasted in our clay oven. Served with rice. Half $13.99 / Full available.",
      price: "19.99",
      categoryId: cid("tandoori"),
      isGlutenFree: true,
      spiceLevel: 2,
      isFeatured: true,
      imageUrl: IMG["tandoori-chicken"],
    },
    {
      name: "Chicken Tikka",
      description:
        "Boneless marinated tender juicy chicken pieces cooked to perfection in the clay oven.",
      price: "16.99",
      categoryId: cid("tandoori"),
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["chicken-tikka"],
    },
    {
      name: "Shrimp Tandoori",
      description:
        "Jumbo marinated juicy shrimp prepared with special spices and cooked in the clay oven.",
      price: "18.99",
      categoryId: cid("tandoori"),
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["shrimp"],
    },
    {
      name: "Boti Kabab",
      description:
        "Cubes of boneless lamb marinated overnight in yogurt, ginger, and cilantro, cooked in the tandoor.",
      price: "20.99",
      categoryId: cid("tandoori"),
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["kebab"],
    },
    {
      name: "Chicken Ginger Kabab",
      description:
        "Marinated cubes of chicken dipped in ginger and cooked with aromatic herbs in the clay oven.",
      price: "18.99",
      categoryId: cid("tandoori"),
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["kebab"],
    },
    {
      name: "Vegetable Kabab",
      description:
        "A colorful assortment of seasonal vegetables marinated in spices and grilled in the tandoor.",
      price: "16.99",
      categoryId: cid("tandoori"),
      isVegetarian: true,
      isGlutenFree: true,
      spiceLevel: 1,
      imageUrl: IMG["kebab"],
    },
    {
      name: "Tandoori Mixed Grill",
      description:
        "An assortment of all our tandoori specialties — the ultimate sharing platter. Served with rice.",
      price: "23.99",
      categoryId: cid("tandoori"),
      isGlutenFree: true,
      spiceLevel: 2,
      isFeatured: true,
      imageUrl: IMG["mixed-grill"],
    },

    // ── CHICKEN (served with Rice) ────────────────────────────────────
    {
      name: "Chicken Curry",
      description:
        "Selected pieces of chicken cooked in a light spiced golden homemade sauce.",
      price: "13.99",
      categoryId: cid("chicken"),
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["chicken-curry"],
    },
    {
      name: "Chicken Shahi Korma",
      description:
        "Chicken simmered with delicious Kashmiri herbs, cooked in cream and sprinkled with nuts.",
      price: "14.99",
      categoryId: cid("chicken"),
      isGlutenFree: true,
      spiceLevel: 1,
      imageUrl: IMG["paneer-makhani"],
    },
    {
      name: "Chicken Sagwala",
      description: "Boneless chicken cooked fresh with chopped spinach, herbs, and ginger.",
      price: "14.99",
      categoryId: cid("chicken"),
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["saag-paneer"],
    },
    {
      name: "Chicken with Vegetable",
      description: "Boneless chicken cooked with fresh seasonal vegetables and aromatic spices.",
      price: "14.99",
      categoryId: cid("chicken"),
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["chicken-curry"],
    },
    {
      name: "Chicken Vindaloo",
      description: "Goan-style fiery curry — chicken cooked in hot spices and potatoes.",
      price: "14.99",
      categoryId: cid("chicken"),
      isGlutenFree: true,
      spiceLevel: 3,
      imageUrl: IMG["vindaloo"],
    },
    {
      name: "Chicken Tikka Masala",
      description:
        "Diced boneless chicken tikka cooked with fresh tomatoes, cream, and a touch of garam masala.",
      price: "15.99",
      categoryId: cid("chicken"),
      isGlutenFree: true,
      spiceLevel: 2,
      isFeatured: true,
      imageUrl: IMG["chicken-tikka-masala"],
    },
    {
      name: "Chicken Makhani",
      description:
        "Chicken from the clay oven tossed in butter, cultured yogurt, and served in a creamy red sauce.",
      price: "14.99",
      categoryId: cid("chicken"),
      spiceLevel: 1,
      imageUrl: IMG["butter-chicken"],
    },
    {
      name: "Butter Chicken",
      description:
        "Chicken barbecued in a clay oven and cooked in a rich, velvety spiced cream sauce.",
      price: "15.99",
      categoryId: cid("chicken"),
      spiceLevel: 1,
      isFeatured: true,
      imageUrl: IMG["butter-chicken"],
    },
    {
      name: "Chicken Mushroom",
      description: "Chicken and fresh mushrooms cooked together in an aromatic spice gravy.",
      price: "14.99",
      categoryId: cid("chicken"),
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["chicken-curry"],
    },
    {
      name: "Kahari Chicken",
      description:
        "Chicken cooked with ground spices and herbs in a traditional iron Karahi wok.",
      price: "14.99",
      categoryId: cid("chicken"),
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["chicken-curry"],
    },
    {
      name: "Tandoori Chicken Masala",
      description:
        "Boneless barbecued tandoori chicken finished in a special creamy red sauce.",
      price: "15.99",
      categoryId: cid("chicken"),
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["butter-chicken"],
    },

    // ── LAMB (served with Rice) ───────────────────────────────────────
    {
      name: "Lamb Curry",
      description: "Selected pieces of tender lamb cooked with special herbs and spices.",
      price: "16.99",
      categoryId: cid("lamb"),
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["lamb-curry"],
    },
    {
      name: "Lamb Rogan Josh",
      description:
        "Selected pieces of lamb cooked with special herbs and spices in classic Punjabi style.",
      price: "16.99",
      categoryId: cid("lamb"),
      isGlutenFree: true,
      spiceLevel: 2,
      isFeatured: true,
      imageUrl: IMG["lamb-rogan"],
    },
    {
      name: "Lamb Shahi Korma",
      description:
        "Diced lamb simmered with Kashmiri herbs, dry nuts, and cooked in a rich creamy sauce.",
      price: "16.99",
      categoryId: cid("lamb"),
      isGlutenFree: true,
      spiceLevel: 1,
      imageUrl: IMG["paneer-makhani"],
    },
    {
      name: "Lamb Sahwala",
      description:
        "Boneless lamb cooked with chopped spinach in South Indian style.",
      price: "16.99",
      categoryId: cid("lamb"),
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["saag-paneer"],
    },
    {
      name: "Lamb Vindaloo",
      description: "Cubes of lamb cooked Indian style with hot spices and potatoes.",
      price: "16.99",
      categoryId: cid("lamb"),
      isGlutenFree: true,
      spiceLevel: 3,
      imageUrl: IMG["vindaloo"],
    },
    {
      name: "Lamb Mushroom",
      description: "Lamb cubes cooked with mushrooms in a special homemade sauce.",
      price: "16.99",
      categoryId: cid("lamb"),
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["lamb-curry"],
    },
    {
      name: "Lamb Tikka Masala",
      description:
        "Tandoori lamb cooked with butter and tomatoes, served with a creamy red sauce.",
      price: "18.99",
      categoryId: cid("lamb"),
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["chicken-tikka-masala"],
    },
    {
      name: "Karahi Lamb",
      description:
        "Lamb cubes cooked with ground spices and herbs in a traditional iron Karahi.",
      price: "16.99",
      categoryId: cid("lamb"),
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["lamb-curry"],
    },

    // ── GOAT (served with Rice) ───────────────────────────────────────
    {
      name: "Goat Curry",
      description:
        "Selected pieces of goat cooked in a traditional North Indian style with onions and tomatoes.",
      price: "19.99",
      categoryId: cid("goat"),
      isGlutenFree: true,
      spiceLevel: 2,
      isFeatured: true,
      imageUrl: IMG["lamb-rogan"],
    },
    {
      name: "Goat Rogan Josh",
      description:
        "Selected pieces of goat cooked with special herbs and spices in Punjabi style.",
      price: "19.99",
      categoryId: cid("goat"),
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["lamb-rogan"],
    },
    {
      name: "Goat Vindaloo",
      description: "Goat cooked in South Indian style with hot spices and potatoes.",
      price: "19.99",
      categoryId: cid("goat"),
      isGlutenFree: true,
      spiceLevel: 3,
      imageUrl: IMG["vindaloo"],
    },
    {
      name: "Goat Sagwala",
      description: "Tender goat pieces cooked with fresh chopped spinach and aromatic herbs.",
      price: "19.99",
      categoryId: cid("goat"),
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["saag-paneer"],
    },

    // ── SEAFOOD (served with Rice) ────────────────────────────────────
    {
      name: "Fish Masala",
      description:
        "Boneless fish cubes cooked with bell peppers, tomatoes, herbs, and special spices.",
      price: "15.99",
      categoryId: cid("seafood"),
      spiceLevel: 2,
      imageUrl: IMG["fish-masala"],
    },
    {
      name: "Shrimp Vindaloo",
      description: "Prawns cooked in spicy hot gravy with potatoes — a Goan-inspired delight.",
      price: "16.99",
      categoryId: cid("seafood"),
      isGlutenFree: true,
      spiceLevel: 3,
      imageUrl: IMG["shrimp"],
    },
    {
      name: "Saag Shrimp",
      description:
        "Prawns cooked with garden-fresh chopped spinach, butter, and special spices.",
      price: "16.99",
      categoryId: cid("seafood"),
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["shrimp"],
    },
    {
      name: "Tandoori Shrimp Masala",
      description:
        "Tandoori-marinated shrimp sautéed with ginger and finished in our special sauce.",
      price: "19.99",
      categoryId: cid("seafood"),
      isGlutenFree: true,
      spiceLevel: 2,
      isFeatured: true,
      imageUrl: IMG["shrimp"],
    },

    // ── RICE SPECIALTIES (served with Raita) ─────────────────────────
    {
      name: "Vegetable Biryani",
      description:
        "Fresh vegetables delicately sautéed with basmati rice, saffron, nuts, and raisins.",
      price: "13.99",
      categoryId: cid("biryani"),
      isVegetarian: true,
      isGlutenFree: true,
      spiceLevel: 1,
      imageUrl: IMG["veg-biryani"],
    },
    {
      name: "Chicken Biryani",
      description:
        "Tender pieces of chicken cooked with fragrant basmati rice, herbs, nuts, and raisins.",
      price: "14.99",
      categoryId: cid("biryani"),
      isGlutenFree: true,
      spiceLevel: 2,
      isFeatured: true,
      imageUrl: IMG["biryani"],
    },
    {
      name: "Lamb Biryani",
      description:
        "Tender pieces of lamb layered with basmati rice, herbs, saffron, nuts, and raisins.",
      price: "17.99",
      categoryId: cid("biryani"),
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["biryani"],
    },
    {
      name: "Shrimp Biryani",
      description:
        "Jumbo shrimp cooked with fragrant basmati rice, special herbs, nuts, and raisins.",
      price: "19.99",
      categoryId: cid("biryani"),
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["biryani"],
    },
    {
      name: "Goat Biryani",
      description:
        "Tender pieces of goat layered with basmati rice, herbs, saffron, nuts, and raisins.",
      price: "16.99",
      categoryId: cid("biryani"),
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["biryani"],
    },
    {
      name: "Mushroom & Peas Pulao",
      description: "Saffron-flavored basmati rice cooked with mushrooms, peas, and aromatic spices.",
      price: "9.99",
      categoryId: cid("biryani"),
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      spiceLevel: 1,
      imageUrl: IMG["veg-biryani"],
    },

    // ── SIDES ─────────────────────────────────────────────────────────
    {
      name: "Basmati Rice (Small)",
      description: "Steamed fragrant basmati rice — small portion.",
      price: "2.99",
      categoryId: cid("sides"),
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      spiceLevel: 0,
      imageUrl: IMG["rice"],
    },
    {
      name: "Basmati Rice (Large)",
      description: "Steamed fragrant basmati rice — large portion.",
      price: "3.99",
      categoryId: cid("sides"),
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      spiceLevel: 0,
      imageUrl: IMG["rice"],
    },
    {
      name: "Plain Yogurt",
      description: "Fresh homemade yogurt — cooling and creamy.",
      price: "3.99",
      categoryId: cid("sides"),
      isVegetarian: true,
      isGlutenFree: true,
      spiceLevel: 0,
      imageUrl: IMG["yogurt"],
    },
    {
      name: "Mixed Green Salad",
      description: "Sliced cucumber, tomatoes, and lettuce with a light dressing.",
      price: "4.99",
      categoryId: cid("sides"),
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      spiceLevel: 0,
      imageUrl: IMG["salad"],
    },
    {
      name: "Mango Chutney",
      description: "Sweet and tangy homemade mango chutney.",
      price: "3.99",
      categoryId: cid("sides"),
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      spiceLevel: 0,
      imageUrl: IMG["chutney"],
    },
    {
      name: "Mixed Pickle",
      description: "Traditional South Asian mixed vegetable pickle.",
      price: "3.99",
      categoryId: cid("sides"),
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      spiceLevel: 2,
      imageUrl: IMG["chutney"],
    },
    {
      name: "Raita",
      description:
        "Cool whipped yogurt with cucumber, tomatoes, garnished with cilantro and mint.",
      price: "3.99",
      categoryId: cid("sides"),
      isVegetarian: true,
      isGlutenFree: true,
      spiceLevel: 0,
      imageUrl: IMG["yogurt"],
    },

    // ── DESSERTS ──────────────────────────────────────────────────────
    {
      name: "Gulab Jamun",
      description:
        "Cottage cheese balls, deep fried and dipped in fragrant honey syrup with rose water.",
      price: "4.99",
      categoryId: cid("desserts"),
      isVegetarian: true,
      spiceLevel: 0,
      isFeatured: true,
      imageUrl: IMG["gulab-jamun"],
    },
    {
      name: "Rice Pudding",
      description:
        "Made from special rice cooked slowly with milk and sugar, served cold with nuts and pistachios.",
      price: "4.99",
      categoryId: cid("desserts"),
      isVegetarian: true,
      isGlutenFree: true,
      spiceLevel: 0,
      imageUrl: IMG["rice-pudding"],
    },
    {
      name: "Gajrela",
      description: "A famous North Indian dessert made from slow-cooked carrots, milk, and sugar.",
      price: "7.99",
      categoryId: cid("desserts"),
      isVegetarian: true,
      isGlutenFree: true,
      spiceLevel: 0,
      imageUrl: IMG["halwa"],
    },
    {
      name: "Barfi",
      description: "Special Indian milk-based sweet, dense and rich — often called Indian cheese cake.",
      price: "7.99",
      categoryId: cid("desserts"),
      isVegetarian: true,
      isGlutenFree: true,
      spiceLevel: 0,
      imageUrl: IMG["halwa"],
    },

    // ── BEVERAGES ─────────────────────────────────────────────────────
    {
      name: "Mango Lassi",
      description:
        "Creamy yogurt blended with sweet ripe mango and a touch of cardamom.",
      price: "3.99",
      categoryId: cid("beverages"),
      isVegetarian: true,
      isGlutenFree: true,
      spiceLevel: 0,
      isFeatured: true,
      imageUrl: IMG["mango-lassi"],
    },
    {
      name: "Rose Lassi",
      description: "Refreshing yogurt drink blended with fragrant rose syrup.",
      price: "3.99",
      categoryId: cid("beverages"),
      isVegetarian: true,
      isGlutenFree: true,
      spiceLevel: 0,
      imageUrl: IMG["mango-lassi"],
    },
    {
      name: "Lassie (Sweet or Salted)",
      description: "Classic yogurt-based drink — choose sweet or salted.",
      price: "3.49",
      categoryId: cid("beverages"),
      isVegetarian: true,
      isGlutenFree: true,
      spiceLevel: 0,
      imageUrl: IMG["mango-lassi"],
    },
    {
      name: "Mango Juice",
      description: "Fresh mango juice — sweet and tropical.",
      price: "3.99",
      categoryId: cid("beverages"),
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      spiceLevel: 0,
      imageUrl: IMG["juice"],
    },
    {
      name: "Mango Shake",
      description: "Thick and creamy mango milkshake made with real mango and milk.",
      price: "3.99",
      categoryId: cid("beverages"),
      isVegetarian: true,
      isGlutenFree: true,
      spiceLevel: 0,
      imageUrl: IMG["mango-lassi"],
    },
    {
      name: "Masala Chai",
      description: "Black tea simmered with milk, cardamom, ginger, and warming spices.",
      price: "2.49",
      categoryId: cid("beverages"),
      isVegetarian: true,
      isGlutenFree: true,
      spiceLevel: 0,
      imageUrl: IMG["chai"],
    },
    {
      name: "Can Soda",
      description: "Assorted canned soft drinks.",
      price: "1.50",
      categoryId: cid("beverages"),
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      spiceLevel: 0,
      imageUrl: IMG["juice"],
    },
  ]);
  console.log("Seeded menu items.");

  // ── Testimonials ───────────────────────────────────────────────────────
  await db.insert(testimonialsTable).values([
    {
      name: "Cedric Busteed",
      rating: 5,
      message:
        "Fantastic little hole in the wall with great variety. Service is great and food is authentic.",
      isApproved: true,
    },
    {
      name: "Emily W.",
      rating: 5,
      message:
        "The takeout was on time and the food was delicious! The mango smoothie is superb.",
      isApproved: true,
    },
    {
      name: "Cameron Brown",
      rating: 5,
      message:
        "I've been coming here pretty regularly for about five years now. Flavorful food and a great lunch buffet. The decor keeps improving and service is on point.",
      isApproved: true,
    },
    {
      name: "Carson Teixeira",
      rating: 5,
      message:
        "The food is wonderful, the portions are large, and extra spice really means extra spice here. Much love.",
      isApproved: true,
    },
    {
      name: "Priya Sharma",
      rating: 5,
      message:
        "As an Indian living in Iowa, this is the closest I've ever felt to my mother's cooking. The Dal Makhani in particular is absolutely sublime.",
      isApproved: true,
    },
    {
      name: "Marcus Reed",
      rating: 5,
      message:
        "We celebrated our anniversary here and the staff made it incredibly special. The lamb rogan josh is otherworldly.",
      isApproved: true,
    },
  ]);
  console.log("Seeded testimonials.");

  console.log("✅  India Cafe seed complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
