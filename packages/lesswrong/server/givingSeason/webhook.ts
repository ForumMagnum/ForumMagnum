import { Express, Request, json } from "express";
import { PublicInstanceSetting } from "@/lib/instanceSettings";
import { captureEvent } from "@/lib/analyticsEvents";
import { getExchangeRate } from "./currencies";
import DatabaseMetadataRepo from "../repos/DatabaseMetadataRepo";
import { GIVING_SEASON_ENABLED } from "@/lib/givingSeason";

export const addToGivingSeasonTotal = async (usdAmount: number) => {
  if (Number.isFinite(usdAmount) && usdAmount > 0) {
    await new DatabaseMetadataRepo().addGivingSeason2025Donation(usdAmount);
  }
}

export const setGivingSeasonTotal = async (usdAmount: number) => {
  if (Number.isFinite(usdAmount) && usdAmount > 0) {
    await new DatabaseMetadataRepo().setGivingSeason2025DonationTotal(usdAmount);
  }
}

const everyBearer = new PublicInstanceSetting<string | null>(
  "givingSeason.everyBearer",
  null,
  "optional",
);

const hasVerifiedBearer = (req: Request): boolean => {
  const token = everyBearer.get();
  if (!token) {
    // eslint-disable-next-line no-console
    console.warn("Every.org bearer token not configured");
    return false;
  }
  const auth = req.headers.authorization;
  if (!auth) {
    // eslint-disable-next-line no-console
    console.warn("Every.org auth header not present:", req.headers);
    return false;
  }
  if (auth !== `Bearer ${token}`) {
    // eslint-disable-next-line no-console
    console.warn("Invalid every.org auth header:", auth);
    return false;
  }
  return true;
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
  if (!GIVING_SEASON_ENABLED) {
    return;
  }

  const webhook = "/api/donation-election-2025-webhook";
  app.use(webhook, json({limit: "10mb"}));
  app.post(webhook, async (req, res) => {
    const isVerified = hasVerifiedBearer(req);

    const payload = req.body as WebhookPayload;
    const {netAmount, amount, currency = "USD"} = payload;
    const parsedAmount = parseFloat(netAmount ?? amount ?? "0");
    const exchangeRate = await getExchangeRate(currency);
    const usdAmount = parsedAmount * exchangeRate;

    if (isVerified && Number.isFinite(usdAmount) && usdAmount > 0) {
      await addToGivingSeasonTotal(usdAmount);
    }

    captureEvent("givingSeason2025Donation", {
      isVerified,
      payload: payload as Json,
      parsedAmount,
      exchangeRate,
      usdAmount,
    });

    res.status(200).end("");
  });
}
