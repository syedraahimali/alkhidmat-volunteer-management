import { z } from "zod";

const optionalText = z.string().trim().optional().transform((value) => value || null);
const optionalInteger = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? Number(value) : null))
  .pipe(z.number().int().min(0).nullable());

const dateTimeField = (message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date and time.");

const optionalDateTime = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || null)
  .refine((value) => value === null || !Number.isNaN(Date.parse(value)), "Enter a valid date and time.");

export const createEventSchema = z
  .object({
    eventName: z.string().trim().min(1, "Event name is required."),
    description: optionalText,
    location: z.string().trim().min(1, "Location is required."),
    startTime: dateTimeField("Start date/time is required."),
    endTime: dateTimeField("End date/time is required."),
    status: z.enum(["upcoming", "ongoing", "completed", "cancelled"]),
    volunteerSlots: optionalInteger,
    registrationOpensAt: optionalDateTime,
    registrationClosesAt: optionalDateTime,
    taskRequirements: optionalText,
    skillsRequired: optionalText,
    coordinatorName: optionalText,
    coordinatorContact: optionalText,
    instructions: optionalText,
    certificateTitle: optionalText,
    certificateThresholdMinutes: optionalInteger,
  })
  .superRefine((value, context) => {
    const startTime = Date.parse(value.startTime);
    const endTime = Date.parse(value.endTime);

    if (!Number.isNaN(startTime) && !Number.isNaN(endTime) && endTime <= startTime) {
      context.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time must be after start time.",
      });
    }

    if (value.registrationOpensAt && value.registrationClosesAt) {
      const opensAt = Date.parse(value.registrationOpensAt);
      const closesAt = Date.parse(value.registrationClosesAt);
      if (!Number.isNaN(opensAt) && !Number.isNaN(closesAt) && closesAt < opensAt) {
        context.addIssue({
          code: "custom",
          path: ["registrationClosesAt"],
          message: "Registration deadline must be after registration opening.",
        });
      }
    }
  });

export type CreateEventInput = z.infer<typeof createEventSchema>;
