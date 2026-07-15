import { z } from "zod";

export const billingSubscriptionSyncSchema = z.object({
  productKey: z.string().min(1),
  tenantId: z.string().min(1),
  userId: z.string().uuid(),
  planCode: z.string().min(1),
  saLicenseType: z.enum(["monthly", "annual", "lifetime"]).optional(),
  stripeCustomerId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
  status: z.enum(["active", "trialing", "past_due", "canceled", "incomplete"]).default("active"),
});

export const billingWebhookEnvelopeSchema = z.object({
  type: z.enum([
    "checkout.session.completed",
    "invoice.paid",
    "invoice.payment_failed",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ]),
  data: z.record(z.unknown()),
  stripeEventId: z.string().optional(),
});

export const billingSchemas = {
  subscriptionSync: billingSubscriptionSyncSchema,
  webhook: billingWebhookEnvelopeSchema,
};
