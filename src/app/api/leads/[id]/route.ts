import { NextRequest, NextResponse } from "next/server";
import { getLeadById, updateLead, deleteLead, getActiveDatabaseProvider } from "@/lib/db";
import { validateLead } from "@/lib/validation";

// GET /api/leads/[id] - Fetch a single lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lead = await getLeadById(id);

    if (!lead) {
      return NextResponse.json(
        { success: false, error: `Lead with ID "${id}" was not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: lead,
      database: getActiveDatabaseProvider(),
    });
  } catch (error: unknown) {
    console.error("Error fetching single lead:", error);
    const msg = error instanceof Error ? error.message : "Failed to retrieve lead";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

// PATCH /api/leads/[id] - Update an existing lead
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await getLeadById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: `Lead with ID "${id}" not found.` },
        { status: 404 }
      );
    }

    // Partial validation
    const { isValid, errors } = validateLead(body, true);
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

    const updated = await updateLead(id, body);

    return NextResponse.json({
      success: true,
      message: "Lead updated successfully",
      data: updated,
      database: getActiveDatabaseProvider(),
    });
  } catch (error: unknown) {
    console.error("Error updating lead:", error);
    const msg = error instanceof Error ? error.message : "Failed to update lead";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

// DELETE /api/leads/[id] - Delete a lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await getLeadById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: `Lead with ID "${id}" not found.` },
        { status: 404 }
      );
    }

    await deleteLead(id);

    return NextResponse.json({
      success: true,
      message: `Lead "${existing.name}" successfully deleted.`,
      database: getActiveDatabaseProvider(),
    });
  } catch (error: unknown) {
    console.error("Error deleting lead:", error);
    const msg = error instanceof Error ? error.message : "Failed to delete lead";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
