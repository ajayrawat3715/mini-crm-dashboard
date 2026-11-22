import { NextRequest, NextResponse } from "next/server";
import { getLeads, createLead, getActiveDatabaseProvider } from "@/lib/db";
import { validateLead } from "@/lib/validation";

// GET /api/leads - Fetch all leads with optional search & status filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";

    const { leads, stats, provider } = await getLeads(search, status);

    return NextResponse.json({
      success: true,
      data: leads,
      stats,
      database: provider,
    });
  } catch (error: unknown) {
    console.error("Error fetching leads:", error);
    const msg = error instanceof Error ? error.message : "Failed to fetch leads";
    return NextResponse.json(
      {
        success: false,
        error: `Database error (${getActiveDatabaseProvider()}): ${msg}`,
      },
      { status: 500 }
    );
  }
}

// POST /api/leads - Create a new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { isValid, errors } = validateLead(body);
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          errors,
        },
        { status: 400 }
      );
    }

    const newLead = await createLead(body);

    return NextResponse.json(
      {
        success: true,
        message: "Lead created successfully",
        data: newLead,
        database: getActiveDatabaseProvider(),
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating lead:", error);
    const msg = error instanceof Error ? error.message : "Failed to create lead";
    return NextResponse.json(
      {
        success: false,
        error: `Failed to save lead to ${getActiveDatabaseProvider()}: ${msg}`,
      },
      { status: 500 }
    );
  }
}
