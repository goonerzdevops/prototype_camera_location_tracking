/**
 * Script to update Ticket status to NO_RESPONSE if createdAt >= 20 hours.
 * Uses Prisma Client — works cross-platform (Windows, Linux, macOS).
 *
 * Usage:
 *   npx tsx prisma/update_no_response.ts
 *
 * Or add to package.json scripts:
 *   "update:no-response": "npx tsx prisma/update_no_response.ts"
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const HOURS_THRESHOLD = 20;

async function main() {
  const cutoffDate = new Date(Date.now() - HOURS_THRESHOLD * 60 * 60 * 1000);

  console.log(
    `[update_no_response] Checking tickets created before ${cutoffDate.toISOString()}...`
  );

  const result = await prisma.ticket.updateMany({
    where: {
      createdAt: {
        lte: cutoffDate,
      },
      status: {
        notIn: ["APPROVED", "REJECTED", "NO_RESPONSE"],
      },
    },
    data: {
      status: "NO_RESPONSE",
      updatedAt: new Date(),
    },
  });

  console.log(
    `[update_no_response] ${result.count} ticket(s) updated to NO_RESPONSE.`
  );
}

main()
  .catch((e) => {
    console.error("[update_no_response] Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });