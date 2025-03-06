import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import SingleColumnSection from "@/components/common/SingleColumnSection";
import { SectionTitle } from "@/components/common/SectionTitle";
import Divider from "@/components/common/Divider";
import SequencesNewButton from "@/components/sequences/SequencesNewButton";
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

export const AFLibraryPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  return <div>
    <AnalyticsContext pageContext="sequencesHome">
      <SingleColumnSection>
        <Typography variant="display3" className={classes.pageTitle}>The Library</Typography>
      </SingleColumnSection>
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
  </div>;
}

const AFLibraryPageComponent = registerComponent('AFLibraryPage', AFLibraryPage, {styles});

declare global {
  interface ComponentTypes {
    AFLibraryPage: typeof AFLibraryPageComponent
  }
}

export default AFLibraryPageComponent;

