export type LeadStatus = "New" | "Contacted" | "Converted";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  status: LeadStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadStats {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  convertedLeads: number;
  conversionRate: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  stats?: LeadStats;
  error?: string;
  errors?: Record<string, string>;
  message?: string;
}
