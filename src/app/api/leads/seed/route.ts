import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SAMPLE_LEADS } from "@/lib/seed-data";

// POST /api/leads/seed - Seed or reset sample demo leads
export async function POST() {
  try {
    // Delete existing leads
    await prisma.lead.deleteMany({});

    // Insert sample leads
    for (const lead of SAMPLE_LEADS) {
      await prisma.lead.create({
        data: lead,
      });
    }

    const count = await prisma.lead.count();

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${count} sample demo leads.`,
      count,
    });
  } catch (error) {
    console.error("Error seeding leads:", error);
    return NextResponse.json(
      { success: false, error: "Failed to seed demo data." },
      { status: 500 }
    );
  }
}
