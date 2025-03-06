import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import SingleColumnSection from "@/components/common/SingleColumnSection";
import { SectionTitle } from "@/components/common/SectionTitle";
import Divider from "@/components/common/Divider";
import SequencesNewButton from "@/components/sequences/SequencesNewButton";
import LWCoreReading from "@/components/sequences/LWCoreReading";
import SequencesGridWrapper from "@/components/sequences/SequencesGridWrapper";
import { Typography } from "@/components/common/Typography";

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

export default LibraryPageComponent;

