import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
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
  const user = await prisma.user.upsert({
    where: { id: "local-user" },
    update: {},
    create: { id: "local-user", name: "Local User" }
  });

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: { group: category.group },
      create: category
    });
  }

  await prisma.account.upsert({
    where: { name: "AIB Current" },
    update: {},
    create: {
      name: "AIB Current",
      institution: "AIB",
      owner: "Diego",
      type: "bank",
      currency: "EUR",
      balance: 0,
      userId: user.id
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
