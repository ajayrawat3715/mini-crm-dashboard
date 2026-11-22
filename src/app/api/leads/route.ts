import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateLead } from "@/lib/validation";

// GET /api/leads - Fetch all leads with optional search & status filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";

    // Build Prisma query filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (status && status !== "All") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { businessName: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    // Fetch filtered leads and total counts concurrently
    const [leads, allLeads] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
      }),
      // Unfiltered counts for the dashboard overview metrics
      prisma.lead.findMany({
        select: { status: true },
      }),
    ]);

    const totalLeads = allLeads.length;
    const newLeads = allLeads.filter((l) => l.status === "New").length;
    const contactedLeads = allLeads.filter((l) => l.status === "Contacted").length;
    const convertedLeads = allLeads.filter((l) => l.status === "Converted").length;
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: leads,
      stats: {
        totalLeads,
        newLeads,
        contactedLeads,
        convertedLeads,
        conversionRate,
      },
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch leads from database. Please try again.",
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

    const { name, email, phone, businessName, status, notes } = body;

    const newLead = await prisma.lead.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        businessName: businessName.trim(),
        status: status || "New",
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Lead created successfully",
        data: newLead,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while saving the lead.",
      },
      { status: 500 }
    );
  }
}
