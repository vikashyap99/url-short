import { z } from "zod";

const urlRegex = /^https?:\/\/.+/;

export const createUrlSchema = z.object({
  body: z.object({
    redirectUrl: z
      .string({ required_error: "redirectUrl is required" })
      .url("redirectUrl must be a valid URL")
      .max(2048, "redirectUrl must not exceed 2048 characters")
      .refine((val) => urlRegex.test(val), {
        message: "redirectUrl must use http or https protocol",
      }),
    customAlias: z
      .string()
      .regex(
        /^[a-zA-Z0-9_-]{4,20}$/,
        "customAlias must be 4-20 characters, alphanumeric, underscore, or hyphen",
      )
      .optional(),
    expiresInDays: z
      .number()
      .int()
      .min(1, "expiresInDays must be at least 1")
      .max(365, "expiresInDays must not exceed 365")
      .optional(),
  }),
});

export const redirectParamsSchema = z.object({
  params: z.object({
    shortId: z
      .string({ required_error: "shortId is required" })
      .min(4, "Invalid shortId")
      .max(20, "Invalid shortId"),
  }),
});

export const analyticsParamsSchema = z.object({
  params: z.object({
    shortId: z
      .string({ required_error: "shortId is required" })
      .min(4, "Invalid shortId")
      .max(20, "Invalid shortId"),
  }),
});
