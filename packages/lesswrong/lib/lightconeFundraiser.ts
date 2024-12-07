import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { isLW } from "./instanceSettings";
import { lightconeFundraiserUnsyncedAmount } from "./publicSettings";
import { useEffect, useState } from "react";

export const useFundraiserStripeTotal = () => {
  const { data } = useQuery(gql`
    query Lightcone2024FundraiserStripeAmounts {
      Lightcone2024FundraiserStripeAmounts
    }
  `, {
    ssr: true,
  });

  const stripeAmounts: number[] = data?.Lightcone2024FundraiserStripeAmounts || [];

  const stripeTotal = Math.floor(stripeAmounts.reduce((a, b) => a + b, 0) / 100);

  return stripeTotal;
}

export const useFundraiserProgress = (goalAmount: number) => {
  const stripeTotal = useFundraiserStripeTotal();
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
