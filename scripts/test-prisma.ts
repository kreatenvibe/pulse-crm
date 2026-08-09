import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  const leads = await prisma.leads.findMany();
  console.log(leads);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
