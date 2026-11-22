import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateLead } from "@/lib/validation";

// GET /api/leads/[id] - Fetch a single lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: `Lead with ID "${id}" was not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    console.error("Error fetching single lead:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve lead details." },
      { status: 500 }
    );
  }
}

// PATCH /api/leads/[id] - Update an existing lead (full or partial update)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if lead exists
    const existing = await prisma.lead.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: `Lead with ID "${id}" not found.` },
        { status: 404 }
      );
    }

    // Partial validation for provided fields
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

    // Prepare update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.email !== undefined) updateData.email = body.email.trim().toLowerCase();
    if (body.phone !== undefined) updateData.phone = body.phone.trim();
    if (body.businessName !== undefined) updateData.businessName = body.businessName.trim();
    if (body.status !== undefined) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Lead updated successfully",
      data: updatedLead,
    });
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while updating the lead." },
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

    const existing = await prisma.lead.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: `Lead with ID "${id}" not found.` },
        { status: 404 }
      );
    }

    await prisma.lead.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Lead "${existing.name}" successfully deleted.`,
    });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete the lead." },
      { status: 500 }
    );
  }
}
