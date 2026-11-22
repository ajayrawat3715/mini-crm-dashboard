export interface LeadInput {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  status: "New" | "Contacted" | "Converted";
  notes?: string;
}

export const SAMPLE_LEADS: LeadInput[] = [
  {
    name: "Sarah Jenkins",
    email: "sarah.jenkins@acmeinnovations.com",
    phone: "+1 (555) 234-5678",
    businessName: "Acme Innovations",
    status: "Converted",
    notes: "Signed enterprise annual contract. Onboarding kickoff scheduled.",
  },
  {
    name: "Michael Chang",
    email: "mchang@nexuslogistics.io",
    phone: "+1 (555) 876-5432",
    businessName: "Nexus Logistics",
    status: "Contacted",
    notes: "Demo delivered on Tuesday. Following up on fleet tracking integration.",
  },
  {
    name: "Elena Rostova",
    email: "elena.r@solardynamics.com",
    phone: "+1 (555) 345-6789",
    businessName: "Solar Dynamics Inc.",
    status: "New",
    notes: "Inquired via contact form regarding commercial solar installations.",
  },
  {
    name: "David Miller",
    email: "david.m@apexretail.co",
    phone: "+1 (555) 987-6543",
    businessName: "Apex Retail Solutions",
    status: "New",
    notes: "Interested in POS system migration for 12 storefront locations.",
  },
  {
    name: "Priya Sharma",
    email: "priya@healthbridge.org",
    phone: "+1 (555) 456-7890",
    businessName: "HealthBridge Clinics",
    status: "Converted",
    notes: "Closed multi-clinic patient portal rollout. Implementation started.",
  },
  {
    name: "James Wilson",
    email: "jwilson@fintechflow.com",
    phone: "+1 (555) 678-1234",
    businessName: "FinTech Flow Corp",
    status: "Contacted",
    notes: "Reviewing security compliance and SOC2 reports before finalizing.",
  },
  {
    name: "Aisha Khan",
    email: "aisha@greengrowth.eco",
    phone: "+1 (555) 789-0123",
    businessName: "GreenGrowth Organics",
    status: "New",
    notes: "Requested a quote for inventory management and carbon accounting.",
  },
  {
    name: "Carlos Mendez",
    email: "carlos@buildcraft.net",
    phone: "+1 (555) 890-1234",
    businessName: "BuildCraft Contractors",
    status: "Converted",
    notes: "Converted from webinar. Subscribed to pro construction tier.",
  },
];
