"use node";

import { v, ConvexError } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { Resend } from "resend";
import { InviteEmail } from "../components/emails/InviteEmail";
import React from "react";

export const sendInvite = action({
  args: {
    planId: v.id("plan"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const inviteInfo: {
      inviteId: any;
      token: string;
      planName: string;
      ownerName: string;
    } = await ctx.runMutation(
      internal.invites.prepareInvite,
      {
        planId: args.planId,
        email: args.email,
      }
    );
    const { inviteId, token, planName, ownerName } = inviteInfo;

    const hostingUrl =
      process.env.HOSTING_URL ||
      process.env.NEXT_PUBLIC_HOSTING_URL ||
      "http://localhost:3000";

    const joinUrl = `${hostingUrl}/dashboard/join?token=${token}`;

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || "Pathfinder AI <onboarding@resend.dev>";

    if (!resendApiKey) {
      console.warn("RESEND_API_KEY is not set. Invite link generated:", joinUrl);
      return { success: true, simulated: true, joinUrl };
    }

    try {
      const resend = new Resend(resendApiKey);

      const emailResult = await resend.emails.send({
        from: fromEmail,
        to: args.email,
        subject: `${ownerName} invited you to collaborate on ${planName}`,
        react: React.createElement(InviteEmail, {
          planName,
          inviterName: ownerName,
          joinUrl,
        }),
      });

      if (emailResult.error) {
        throw new Error(emailResult.error.message);
      }

      return { success: true };
    } catch (err: any) {
      console.error("Failed to send invite email:", err);
      // Delete the pending invite so caller can retry
      await ctx.runMutation(internal.invites.deleteInviteRecord, { inviteId });
      throw new ConvexError(
        `Failed to deliver invite email: ${err?.message || "Please verify the recipient email address."}`
      );
    }
  },
});
