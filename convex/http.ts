import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";
import Stripe from "stripe";

const http = httpRouter();

// -----------------------------------------------------------------------------
// CLERK USERS WEBHOOK
// -----------------------------------------------------------------------------
http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("Missing CLERK_WEBHOOK_SECRET in environment variables");
      return new Response("Missing webhook secret configuration", { status: 500 });
    }

    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing required svix headers", { status: 400 });
    }

    const payload = await request.text();
    const wh = new Webhook(webhookSecret);

    let event: any;
    try {
      event = wh.verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch (err) {
      console.error("Failed to verify Clerk webhook signature:", err);
      return new Response("Invalid webhook signature", { status: 400 });
    }

    const eventType = event.type;
    const data = event.data;

    try {
      switch (eventType) {
        case "user.created":
        case "user.updated": {
          const userId = data.id;
          const email =
            data.email_addresses?.find((e: any) => e.id === data.primary_email_address_id)
              ?.email_address ||
            data.email_addresses?.[0]?.email_address ||
            "";
          const firstName = data.first_name || undefined;
          const lastName = data.last_name || undefined;

          await ctx.runMutation(internal.users.upsertUserFromWebhook, {
            userId,
            email,
            firstName,
            lastName,
          });
          break;
        }

        case "user.deleted": {
          const userId = data.id;
          if (userId) {
            await ctx.runMutation(internal.users.deleteUserCascade, {
              userId,
            });
          }
          break;
        }

        default:
          break;
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error processing Clerk webhook event:", error);
      return new Response("Internal server error handling webhook", { status: 500 });
    }
  }),
});

// -----------------------------------------------------------------------------
// STRIPE WEBHOOK (OPTIONAL PAYMENTS)
// -----------------------------------------------------------------------------
http.route({
  path: "/stripe",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeKey || !webhookSecret) {
      console.warn("[Stripe Webhook] Stripe secret or webhook secret missing.");
      return new Response("Stripe is not configured", { status: 400 });
    }

    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    const payload = await request.text();
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" as any });

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      console.error("[Stripe Webhook] Signature verification failed:", err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === "paid") {
        // Marks paid and adds credits in ONE atomic mutation, idempotent by paymentId
        await ctx.runMutation(internal.stripe.fulfillPaymentIdempotent, {
          paymentId: session.id,
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
