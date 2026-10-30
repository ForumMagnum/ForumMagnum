"use client";

import React from "react";
import SingleColumnSection from "@/components/common/SingleColumnSection";
import SectionTitle from "@/components/common/SectionTitle";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { Link } from "@/lib/reactRouterWrapper";
import { userGetProfileUrlFromSlug } from "@/lib/collections/users/helpers";
import { getAvailableLlms } from "@/lib/languageModels/llmRegistry";

const styles = defineStyles("LlmModelsPage", (theme: ThemeType) => ({
  list: {
    ...theme.typography.body2,
  },
}));

const LlmModelsPage = () => {
  const classes = useStyles(styles);
  return <SingleColumnSection>
    <SectionTitle title="AI Models" />
    <ul className={classes.list}>
      {getAvailableLlms().map(({ family, version }) => <li key={version.name}>
        <Link to={userGetProfileUrlFromSlug(family.accountSlug)}>{version.fullName}</Link>
      </li>)}
    </ul>
  </SingleColumnSection>;
};

export default LlmModelsPage;
