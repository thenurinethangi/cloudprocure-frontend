import { z } from "zod";

// java.util.UUID accepts the canonical 8-4-4-4-12 representation regardless
// of version/variant bits. Validate the same contract at the browser boundary.
export const javaUuidSchema = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  "Invalid UUID",
);

export const createPurchaseRequestSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(2000),
  businessJustification: z.string().trim().min(5).max(2000),
  departmentId: javaUuidSchema,
  costCenterCode: z.string().trim().min(2).max(50),
  currency: z.string().trim().regex(/^[A-Za-z]{3}$/).transform((value) => value.toUpperCase()),
  neededByDate: z.string().min(1),
});

export type CreatePurchaseRequestPayload = z.infer<typeof createPurchaseRequestSchema>;
