"use client";

import React from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import Divider from "../common/Divider";
import SequencesNewButton from "./SequencesNewButton";
import LWCoreReading from "./LWCoreReading";
import SequencesGridWrapper from "./SequencesGridWrapper";
import { Typography } from "../common/Typography";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('LibraryPage', (theme: ThemeType) => ({
  pageTitle: {
    ...theme.typography.headerStyle,
    fontWeight: "bold",
    textTransform: "uppercase",
    borderTopStyle: "solid",
    borderTopWidth: 4,
    paddingTop: 10,
    lineHeight: 1,
    marginTop: 0,
  }
}));

const LibraryPage = () => {
  const classes = useStyles(styles);

  return <React.Fragment>
    <AnalyticsContext pageContext="sequencesHome">
      <SingleColumnSection>
        <Typography variant="display3" className={classes.pageTitle}>The Library</Typography>
      </SingleColumnSection>
      <SingleColumnSection>
        <LWCoreReading />
      </SingleColumnSection>
      <Divider />
      <SingleColumnSection>
        <SectionTitle title="Curated Sequences" />
        <div>
          <SequencesGridWrapper
            terms={{'view':'curatedSequences', limit:100}}
            itemsPerPage={24}
            showAuthor={true}
            showLoadMore={true}
          />
        </div>
      </SingleColumnSection>
      <Divider />
      <SingleColumnSection>
        <SectionTitle  title="Community Sequences" >
          <SequencesNewButton />
        </SectionTitle>
        <div>
          <SequencesGridWrapper
            terms={{'view':'communitySequences', limit:12}}
            itemsPerPage={24}
            showAuthor={true}
            showLoadMore={true}
          />
        </div>
      </SingleColumnSection>
    </AnalyticsContext>
  </React.Fragment>;
};

export default LibraryPage;



