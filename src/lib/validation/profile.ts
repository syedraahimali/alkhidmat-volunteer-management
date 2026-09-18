import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required."),
  phone: z.string().trim().min(7, "Phone number is required."),
  city: z.string().trim().min(2, "City is required."),
  skills: z.string().trim().min(2, "Add at least one skill or area of interest."),
});
