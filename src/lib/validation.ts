export interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  status: "New" | "Contacted" | "Converted";
  notes?: string;
}

export interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  businessName?: string;
  status?: string;
  notes?: string;
}

export const VALID_STATUSES = ["New", "Contacted", "Converted"] as const;
export type LeadStatus = (typeof VALID_STATUSES)[number];

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateLead(data: Partial<LeadFormData>, isPartial = false): {
  isValid: boolean;
  errors: ValidationErrors;
} {
  const errors: ValidationErrors = {};

  // Name validation
  if (!isPartial || data.name !== undefined) {
    if (!data.name || typeof data.name !== "string" || data.name.trim().length === 0) {
      errors.name = "Full name is required";
    } else if (data.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    } else if (data.name.trim().length > 100) {
      errors.name = "Name must not exceed 100 characters";
    }
  }

  // Email validation
  if (!isPartial || data.email !== undefined) {
    if (!data.email || typeof data.email !== "string" || data.email.trim().length === 0) {
      errors.email = "Email address is required";
    } else if (!EMAIL_REGEX.test(data.email.trim())) {
      errors.email = "Please enter a valid email address (e.g., name@example.com)";
    }
  }

  // Phone validation
  if (!isPartial || data.phone !== undefined) {
    if (!data.phone || typeof data.phone !== "string" || data.phone.trim().length === 0) {
      errors.phone = "Phone number is required";
    } else {
      const digitsOnly = data.phone.replace(/\D/g, "");
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        errors.phone = "Phone number must contain between 7 and 15 digits";
      }
    }
  }

  // Business Name validation
  if (!isPartial || data.businessName !== undefined) {
    if (!data.businessName || typeof data.businessName !== "string" || data.businessName.trim().length === 0) {
      errors.businessName = "Business name is required";
    } else if (data.businessName.trim().length < 2) {
      errors.businessName = "Business name must be at least 2 characters";
    } else if (data.businessName.trim().length > 120) {
      errors.businessName = "Business name must not exceed 120 characters";
    }
  }

  // Status validation
  if (!isPartial || data.status !== undefined) {
    if (!data.status || !VALID_STATUSES.includes(data.status as LeadStatus)) {
      errors.status = `Status must be one of: ${VALID_STATUSES.join(", ")}`;
    }
  }

  // Notes validation (optional)
  if (data.notes && data.notes.length > 1000) {
    errors.notes = "Notes must not exceed 1000 characters";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
