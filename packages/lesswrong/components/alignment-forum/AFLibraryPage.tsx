import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { AnalyticsContext } from "../../lib/analyticsEvents";

const styles = (theme: ThemeType): JssStyles => ({
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
});

export const AFLibraryPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { SingleColumnSection, SectionTitle, Divider, SequencesNewButton, SequencesGridWrapper, Typography } = Components

  return <div className={classes.root}>
    <AnalyticsContext pageContext="sequencesHome">
      <SingleColumnSection>
        <Typography variant="display3" className={classes.pageTitle}>The Library</Typography>
      </SingleColumnSection>
      <SingleColumnSection>
        <SectionTitle title="Curated Sequences" />
        <div className={classes.sequencesGridWrapperWrapper}>
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
        <div className={classes.sequencesGridWrapperWrapper}>
          <SequencesGridWrapper
            terms={{'view':'communitySequences', limit:12}}
            itemsPerPage={24}
            showAuthor={true}
            showLoadMore={true}
          />
        </div>
      </SingleColumnSection>
    </AnalyticsContext>
  </div>;
}

const AFLibraryPageComponent = registerComponent('AFLibraryPage', AFLibraryPage, {styles});

declare global {
  interface ComponentTypes {
    AFLibraryPage: typeof AFLibraryPageComponent
  }
}

