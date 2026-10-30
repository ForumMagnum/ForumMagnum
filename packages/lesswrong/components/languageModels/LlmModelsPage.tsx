"use client";

import React from "react";
import SingleColumnSection from "@/components/common/SingleColumnSection";
import SectionTitle from "@/components/common/SectionTitle";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { Link } from "@/lib/reactRouterWrapper";
import { userGetProfileUrlFromSlug } from "@/lib/collections/users/helpers";
import { getLatestLlmVersion, LLM_FAMILIES } from "@/lib/languageModels/llmRegistry";

const styles = defineStyles("LlmModelsPage", (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2,
  },
}));

const LlmModelsPage = () => {
  const classes = useStyles(styles);
  return <SingleColumnSection>
    <SectionTitle title="AI Models" />
    <div className={classes.root}>
      <p>These are the AI models you can mention in a comment: type @ followed by a model's name, and it will reply to your comment.</p>
      <ul>
        {LLM_FAMILIES.map((family) => {
          const version = getLatestLlmVersion(family);
          return version && <li key={family.accountSlug}>
            <Link to={userGetProfileUrlFromSlug(family.accountSlug)}>{version.fullName}</Link>
          </li>;
        })}
      </ul>
    </div>
  </SingleColumnSection>;
};

export default LlmModelsPage;
