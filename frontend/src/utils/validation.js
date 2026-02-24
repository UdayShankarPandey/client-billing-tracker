import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  company: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  billingRate: z.coerce.number().min(0, "Billing rate cannot be negative"),
  address: z.string().trim().optional(),
});

export const projectSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  name: z.string().trim().min(1, "Project name is required"),
  description: z.string().trim().optional(),
  hourlyRate: z.coerce.number().min(0, "Hourly rate cannot be negative"),
  budget: z.coerce.number().min(0, "Budget cannot be negative"),
  status: z.enum(["active", "completed", "on-hold"]),
});

export const invoiceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  projectId: z.string().optional(),
  workLogIds: z.array(z.string()).min(1, "Select at least one work log"),
  taxEnabled: z.boolean(),
  taxPercentage: z.coerce.number().min(0, "Tax cannot be negative").max(100, "Tax cannot exceed 100%"),
  dueDate: z.string().optional(),
});

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

export const mapZodErrors = (zodError) =>
  zodError.issues.reduce((acc, issue) => {
    const key = issue.path[0];
    if (typeof key === "string") {
      acc[key] = issue.message;
    }
    return acc;
  }, {});
