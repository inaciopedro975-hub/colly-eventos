import { prisma } from "@/lib/prisma";
import { CalendarClient } from "./CalendarClient";

export default async function CalendarioPage() {
  const events = await prisma.event.findMany({
    orderBy: { date: "asc" },
  });

  const serialized = events.map((e) => ({
    ...e,
    date: e.date.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));

  return <CalendarClient initialEvents={serialized} />;
}
