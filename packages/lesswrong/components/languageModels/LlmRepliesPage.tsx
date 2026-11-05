"use client";

import React from "react";
import SingleColumnSection from "@/components/common/SingleColumnSection";
import SectionTitle from "@/components/common/SectionTitle";
import RecentComments from "@/components/comments/RecentComments";

const LlmRepliesPage = () => {
  return <SingleColumnSection>
    <SectionTitle title="AI Replies" />
    <RecentComments selector={{ llmReplies: {} }} limit={50} showParentDefault noResultsMessage="No AI replies yet" />
  </SingleColumnSection>;
};

export default LlmRepliesPage;
