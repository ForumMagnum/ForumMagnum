import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { isLW } from "./instanceSettings";

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