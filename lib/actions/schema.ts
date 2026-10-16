import { z } from "zod";

export const CreatePlanFormSchema = z
  .object({
    placeName: z
      .string()
      .min(2, "Please enter a destination name (e.g. Kyoto, Japan or Amalfi Coast, Italy)"),
    fromDate: z.number().int().positive("Please select a departure date"),
    toDate: z.number().int().positive("Please select a return date"),
    activityPreferences: z.array(z.string()).default([]),
    companion: z.string().min(1, "Please select who is traveling with you"),
  })
  .refine((data) => data.toDate >= data.fromDate, {
    message: "Return date must be on or after the departure date",
    path: ["toDate"],
  });

export type CreatePlanFormValues = z.infer<typeof CreatePlanFormSchema>;
