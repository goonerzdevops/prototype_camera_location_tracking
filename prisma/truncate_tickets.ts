import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Delete TicketPhoto first (foreign key dependency)
  const photos = await prisma.ticketPhoto.deleteMany();
  console.log(`Deleted ${photos.count} TicketPhoto records`);

  // Then delete Tickets
  const tickets = await prisma.ticket.deleteMany();
  console.log(`Deleted ${tickets.count} Ticket records`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });