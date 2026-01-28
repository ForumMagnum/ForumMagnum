import React from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import SequenceEventPage from "../sequenceEvent/SequenceEventPage";

export const MarginalFundingPage = () => {
  return (
    <SequenceEventPage />
  );
}

export default registerComponent("MarginalFundingPage", MarginalFundingPage);
