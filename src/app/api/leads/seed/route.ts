import { NextResponse } from "next/server";
import { seedSampleLeads, getActiveDatabaseProvider } from "@/lib/db";

// POST /api/leads/seed - Seed or reset sample demo leads
export async function POST() {
  try {
    const { count, provider } = await seedSampleLeads();

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${count} sample leads into ${provider.toUpperCase()}.`,
      count,
      database: provider,
    });
  } catch (error: unknown) {
    console.error("Error seeding leads:", error);
    const msg = error instanceof Error ? error.message : "Failed to seed demo data";
    return NextResponse.json(
      {
        success: false,
        error: `Failed to seed ${getActiveDatabaseProvider()}: ${msg}`,
      },
      { status: 500 }
    );
  }
}
