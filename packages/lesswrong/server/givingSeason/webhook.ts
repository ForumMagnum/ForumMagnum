import { Express, json } from "express";
import { Globals } from "@/lib/vulcan-lib";
import { captureEvent } from "@/lib/analyticsEvents";
import { DatabaseMetadataRepo } from "@/server/repos";
import { getExchangeRate } from "./currencies";

Globals.addToGivingSeasonTotal = async (usdAmount: number) => {
  if (Number.isFinite(usdAmount) && usdAmount > 0) {
    await new DatabaseMetadataRepo().addGivingSeason2024Donation(usdAmount);
  }
}

Globals.setGivingSeasonTotal = async (usdAmount: number) => {
  if (Number.isFinite(usdAmount) && usdAmount > 0) {
    await new DatabaseMetadataRepo().setGivingSeason2024DonationTotal(usdAmount);
  }
}

// See https://docs.every.org/docs/webhooks/
type WebhookPayload = {
  chargeId: string,
  partnerDonationId?: string,
  partnerMetadata?: Record<string, unknown>,
  firstName?: string,
  lastName?: string,
  email?: string,
  toNonprofit: {
    slug: string,
    ein?: string,
    name?: string,
  },
  amount: string,
  netAmount: string,
  currency: string,
  frequency: "Monthly" | "One-time",
  donationDate: string,
  publicTestimony?: string,
  privateNote?: string,
  fromFundraiser?: {
    id: string,
    title: string,
    slug: string,
  },
}

export const addGivingSeasonEndpoints = (app: Express) => {
  const webhook = "/api/donation-election-2024-webhook";
  app.use(webhook, json({limit: "10mb"}));
  app.post(webhook, async (req, res) => {
    const payload = req.body as WebhookPayload;
    const {amount = "0", currency = "USD"} = payload;
    const parsedAmount = parseFloat(amount);
    const exchangeRate = await getExchangeRate(currency);
    const usdAmount = parsedAmount * exchangeRate;
    if (Number.isFinite(usdAmount) && usdAmount > 0) {
      await Globals.addToGivingSeasonTotal(usdAmount);
    }
    captureEvent("givingSeason2024Donation", {
      payload: payload as Json,
      parsedAmount,
      exchangeRate,
      usdAmount,
    });
    res.status(200).end("");
  });
}
