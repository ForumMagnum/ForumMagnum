import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { AnalyticsContext } from "../../lib/analyticsEvents";

const styles = (theme: ThemeType) => ({
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

const LibraryPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { SingleColumnSection, SectionTitle, Divider, SequencesNewButton, LWCoreReading, SequencesGridWrapper, Typography } = Components

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

const LibraryPageComponent = registerComponent('LibraryPage', LibraryPage, {styles});

declare global {
  interface ComponentTypes {
    LibraryPage: typeof LibraryPageComponent
  }
}

