import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import SingleColumnSection from "@/components/common/SingleColumnSection";
import { SectionTitle } from "@/components/common/SectionTitle";
import SequencesNewButton from "@/components/sequences/SequencesNewButton";
import { Typography } from "@/components/common/Typography";
import EACoreReading from "@/components/sequences/EACoreReading";
import { ContentStyles } from "@/components/common/ContentStyles";
import SequencesGridWrapper from "@/components/sequences/SequencesGridWrapper";

const styles = (theme: ThemeType) => ({
  description: {
    marginTop: theme.spacing.unit,
    marginBottom: `${theme.spacing.unit * 2}px !important`,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
})

export const eaSequencesHomeDescription = "Featured readings and collections of posts on specific topics.";

const EASequencesHome = ({classes}: {
  classes: ClassesType<typeof styles>;
}) => {
  return <AnalyticsContext pageContext="eaSequencesHome">
    <SingleColumnSection>
      <SectionTitle title="Core Reading" />
      <EACoreReading />
      <SectionTitle  title="Sequences" >
        <SequencesNewButton />
      </SectionTitle>
      <ContentStyles contentType="post">
        <Typography variant='body1' className={classes.description} gutterBottom>
          Sequences are collections of posts on a common theme, or that build on each other. They
          help authors to develop ideas in ways that would be difficult in a single post. You can also
          add posts written by other people to a sequence if you think they should be read together.
        </Typography>
      </ContentStyles>
      <div>
        <SequencesGridWrapper
          terms={{'view': 'communitySequences', limit: 12}}
          showAuthor={true}
          showLoadMore={true}
        />
      </div>
    </SingleColumnSection>
  </AnalyticsContext>
};

const EASequencesHomeComponent = registerComponent('EASequencesHome', EASequencesHome, {styles});

declare global {
  interface ComponentTypes {
    EASequencesHome: typeof EASequencesHomeComponent
  }
}

export default EASequencesHomeComponent;
