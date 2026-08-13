"use client";

import { toast } from "sonner";
import type { UseFormReturn } from "react-hook-form";
import type { ApiErrorResponse } from "./api-types";

/**
 * Handles API errors globally, adhering to the strict envelope pattern.
 * If a form instance is provided, it will set field-level errors inline.
 * Otherwise, it falls back to a global toast.
 */
export function handleApiError(
  error: unknown,
  form?: UseFormReturn<any>
) {
  // If it's a known envelope from our backend
  const response = error as ApiErrorResponse;
  
  if (response?.success === false && response?.error) {
    const { code, message, field } = response.error;

    if (code === "VALIDATION_ERROR" && form && field) {
      // Direct inline field error
      form.setError(field as any, { message });
      return;
    }

    if (code === "UNAUTHORIZED") {
      // In a real app, this might also trigger a router.push("/login")
      toast.error("Please log in to continue.");
      // window.location.href = "/login";
      return;
    }

    if (code === "RATE_LIMITED") {
      toast.error(message || "You are doing that too fast. Please wait.");
      return;
    }

    // Default global handling for server errors or unhandled validations
    toast.error(message || "Something went wrong on our end.");
    return;
  }

  // Fallback for network failures or completely malformed responses
  toast.error("Something went wrong. Our team has been notified.");
}
