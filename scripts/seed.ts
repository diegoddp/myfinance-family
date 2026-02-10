import { eq } from "drizzle-orm";
import { db } from "../src/lib/db";
import { users, accounts, categories } from "../src/lib/schema";
import { createId } from "../src/lib/id";

const categorySeed = [
  { name: "Groceries", group: "variable" },
  { name: "Utilities", group: "fixed" },
  { name: "Transport", group: "variable" },
  { name: "Dining", group: "variable" },
  { name: "Medical", group: "variable" },
  { name: "Pet", group: "variable" },
  { name: "Baby", group: "variable" },
  { name: "Subscriptions", group: "fixed" },
  { name: "Fees", group: "fixed" },
  { name: "House", group: "fixed" },
  { name: "Income", group: "income" },
  { name: "Transfer", group: "transfer" },
  { name: "Shopping", group: "variable" }
];

async function main() {
  const existingUser = await db.select().from(users).where(eq(users.id, "local-user"));

  if (existingUser.length === 0) {
    await db.insert(users).values({
      id: "local-user",
      name: "Local User",
      createdAt: new Date()
    });
  }

  for (const category of categorySeed) {
    const existing = await db.select().from(categories).where(eq(categories.name, category.name));
    if (existing.length === 0) {
      await db.insert(categories).values({
        id: createId("cat"),
        name: category.name,
        group: category.group
      });
    }
  }

  const existingAccount = await db.select().from(accounts).where(eq(accounts.name, "AIB Current"));
  if (existingAccount.length === 0) {
    await db.insert(accounts).values({
      id: createId("acc"),
      name: "AIB Current",
      institution: "AIB",
      owner: "Diego",
      type: "bank",
      currency: "EUR",
      balance: 0,
      userId: "local-user"
    });
  }
}

main()
  .then(() => {
    console.log("Seed complete");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
