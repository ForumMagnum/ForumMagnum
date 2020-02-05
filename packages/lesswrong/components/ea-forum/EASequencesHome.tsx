import React from 'react';
import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import { withStyles, createStyles } from '@material-ui/core/styles';
import { legacyBreakpoints } from '../../lib/utils/theme';
import { postBodyStyles } from '../../themes/stylePiping';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { Typography } from '@material-ui/core';

const styles = createStyles(theme => ({
  description: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
    ...postBodyStyles(theme),
  },
}))

const EASequencesHome = ({classes}) => {

  const { SingleColumnSection, SectionTitle, Divider, SequencesNewButton } = Components
  return <AnalyticsContext pageContext="eaSequencesHome">
    <SingleColumnSection>
      <SectionTitle  title="Sequences" >
        <SequencesNewButton />
      </SectionTitle>
      <Typography variant='body1' className={classes.description}>
          Sequences are collections of posts that are structured such that the posts build on top
          of each other. Anyone can make a sequence. Sequences allow for authors to develop more
          complex ideas than they could with a single post, but you can also make a sequence if you
          think that there is a series of other posts that make more sense when read sequentially.
      </Typography>
      <div className={classes.sequencesGridWrapperWrapper}>
        <Components.SequencesGridWrapper
          terms={{'view': 'communitySequences', limit: 12}}
          listMode={true}
          showAuthor={true}
          showLoadMore={true}
        />
      </div>
    </SingleColumnSection>
  </AnalyticsContext>
};

registerComponent(
  'EASequencesHome',
  EASequencesHome,
  withStyles(styles, {name: "EASequencesHome"}),
);
