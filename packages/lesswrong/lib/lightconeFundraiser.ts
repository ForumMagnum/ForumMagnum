import { useQuery } from "@/lib/crud/useQuery";
import { lightconeFundraiserUnsyncedAmount } from './instanceSettings';
import { useEffect, useState } from "react";
import { gql } from "./generated/gql-codegen";

export const useFundraiserStripeTotal = () => {
  const { data } = useQuery(gql(`
    query Lightcone2024FundraiserStripeAmounts {
      Lightcone2024FundraiserStripeAmounts
    }
  `), {
    ssr: true,
  });

  const stripeAmounts: number[] = data?.Lightcone2024FundraiserStripeAmounts || [];

  const stripeTotal = Math.floor(stripeAmounts.reduce((a, b) => a + b, 0) / 100);

  return stripeTotal;
}

export const useFundraiserAirtableTotal = () => {
  const { data } = useQuery(gql(`
    query Lightcone2025FundraiserAirtableAmounts {
      Lightcone2025FundraiserAirtableAmounts
    }
  `), {
    ssr: true,
  });

  const airtableTotal = data?.Lightcone2025FundraiserAirtableAmounts ?? 0;
  return airtableTotal;
}

export const useFundraiserProgress = (goalAmount: number) => {
  const stripeTotal = 0; // useFundraiserAirtableTotal() commented out for now
  const unsyncedAmount = lightconeFundraiserUnsyncedAmount.get();
  const currentAmount = unsyncedAmount + stripeTotal;
  const percentage = Math.min((currentAmount / goalAmount) * 100, 100);
  return [percentage, currentAmount];
}

// userful for testing
export const useLivePercentage = () => {
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    setInterval(() => {
      // 150 gives us a little time to look at the filled thermometer
      setPercentage(percentage => percentage >= 150 ? 0 : percentage + 0.1);
    }, 1);
  }, []);

  return Math.min(percentage, 100);
}
