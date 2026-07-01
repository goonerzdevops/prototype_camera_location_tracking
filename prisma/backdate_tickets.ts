import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DAYS_BACK = 1;

async function main() {
  const newDate = new Date(Date.now() - DAYS_BACK * 24 * 60 * 60 * 1000);

  // Format new date as YYYYMMDD for ticketNumber replacement
  const yyyy = newDate.getFullYear().toString();
  const mm = (newDate.getMonth() + 1).toString().padStart(2, "0");
  const dd = newDate.getDate().toString().padStart(2, "0");
  const newDateStr = `${yyyy}${mm}${dd}`;

  console.log(
    `[backdate] Setting all tickets' createdAt to ${newDate.toISOString()} and ticketNumber date to ${newDateStr}...`
  );

  // Fetch all tickets to update ticketNumber individually
  const tickets = await prisma.ticket.findMany({
    select: { id: true, ticketNumber: true },
  });

  if (tickets.length === 0) {
    console.log("[backdate] No tickets found.");
    return;
  }

  // Update createdAt in bulk
  await prisma.ticket.updateMany({
    data: {
      createdAt: newDate,
    },
  });

  // Update ticketNumber for each ticket (replace the date portion)
  // Format: TCK-YYYYMMDD-XXXX → TCK-NEWDATE-XXXX
  const ticketNumberRegex = /^(TCK-)\d{8}(-\d+)$/;
  let updatedCount = 0;

  for (const ticket of tickets) {
    const match = ticket.ticketNumber.match(ticketNumberRegex);
    if (match) {
      const newTicketNumber = `${match[1]}${newDateStr}${match[2]}`;
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { ticketNumber: newTicketNumber },
      });
      updatedCount++;
    }
  }

  console.log(
    `[backdate] ${tickets.length} ticket(s) createdAt updated, ${updatedCount} ticketNumber(s) updated.`
  );
}

main()
  .catch((e) => {
    console.error("[backdate] Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });