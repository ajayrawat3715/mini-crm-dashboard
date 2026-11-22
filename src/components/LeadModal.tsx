"use client";

import React, { useState, useEffect } from "react";
import { Lead, LeadStatus } from "@/types/lead";
import { validateLead, ValidationErrors } from "@/lib/validation";
import { X, Loader2, Sparkles, AlertCircle } from "lucide-react";

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    name: string;
    email: string;
    phone: string;
    businessName: string;
    status: LeadStatus;
    notes?: string;
  }) => Promise<boolean>;
  initialData?: Lead | null;
}

export default function LeadModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: LeadModalProps) {
  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    status: "New" as LeadStatus,
    notes: "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync form data when initialData changes or modal opens
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        email: initialData.email,
        phone: initialData.phone,
        businessName: initialData.businessName,
        status: initialData.status,
        notes: initialData.notes || "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        businessName: "",
        status: "New",
        notes: "",
      });
    }
    setErrors({});
    setServerError(null);
  }, [initialData, isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error as user types
    if (errors[name as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) setServerError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const { isValid, errors: validationErrors } = validateLead(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const success = await onSubmit(formData);
      if (success) {
        onClose();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity animate-backdrop"
        onClick={() => !isSubmitting && onClose()}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          role="dialog"
          aria-modal="true"
          className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-slate-200 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isEditing ? "Edit Lead Details" : "Add New Lead"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isEditing
                    ? "Update lead information and enquiry status"
                    : "Fill in the details of the incoming enquiry"}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {serverError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Lead Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Alex Johnson"
                className={`w-full px-3.5 py-2 text-sm bg-slate-50/70 border rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                  errors.name
                    ? "border-rose-400 focus:border-rose-500 bg-rose-50/30"
                    : "border-slate-200 focus:border-indigo-500 focus:bg-white"
                }`}
              />
              {errors.name && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Business Name */}
            <div>
              <label
                htmlFor="businessName"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Business / Organization Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="businessName"
                name="businessName"
                type="text"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="e.g. Apex Global Tech"
                className={`w-full px-3.5 py-2 text-sm bg-slate-50/70 border rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                  errors.businessName
                    ? "border-rose-400 focus:border-rose-500 bg-rose-50/30"
                    : "border-slate-200 focus:border-indigo-500 focus:bg-white"
                }`}
              />
              {errors.businessName && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                  {errors.businessName}
                </p>
              )}
            </div>

            {/* Email & Phone in 2-column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  className={`w-full px-3.5 py-2 text-sm bg-slate-50/70 border rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                    errors.email
                      ? "border-rose-400 focus:border-rose-500 bg-rose-50/30"
                      : "border-slate-200 focus:border-indigo-500 focus:bg-white"
                  }`}
                />
                {errors.email && (
                  <p className="text-xs text-rose-600 mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className={`w-full px-3.5 py-2 text-sm bg-slate-50/70 border rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                    errors.phone
                      ? "border-rose-400 focus:border-rose-500 bg-rose-50/30"
                      : "border-slate-200 focus:border-indigo-500 focus:bg-white"
                  }`}
                />
                {errors.phone && (
                  <p className="text-xs text-rose-600 mt-1">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Status Select */}
            <div>
              <label
                htmlFor="status"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Lead Status <span className="text-rose-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
              >
                <option value="New">New (Fresh enquiry)</option>
                <option value="Contacted">Contacted (In discussion)</option>
                <option value="Converted">Converted (Customer won)</option>
              </select>
              {errors.status && (
                <p className="text-xs text-rose-600 mt-1">{errors.status}</p>
              )}
            </div>

            {/* Notes (Optional) */}
            <div>
              <label
                htmlFor="notes"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Notes / Enquiry Context <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Details about client needs, project scope, or conversation history..."
                className="w-full px-3.5 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all resize-none text-slate-800"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{isEditing ? "Save Changes" : "Create Lead"}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
