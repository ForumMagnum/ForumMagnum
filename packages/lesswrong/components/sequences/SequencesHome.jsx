import React from 'react';
import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import { legacyBreakpoints } from '../../lib/modules/utils/theme';
import Typography from '@material-ui/core/Typography';
import { postBodyStyles } from '../../themes/stylePiping';

const styles = theme => ({
  root: {
  },
  header: {
    marginTop: theme.spacing.unit*3,
    marginBottom: 50,
    [legacyBreakpoints.maxTiny]: {
      paddingLeft: 0,
    }
  },
  library: {
    ...theme.typography.headerStyle,
    fontWeight: 600,
  },
  listTitle: {
    fontWeight: "bold",
    textTransform: "uppercase",
    borderTopStyle: "solid",
    borderTopWidth: 3,

    "& h1": {
      marginTop: 7,
    }
  },
  listDescription: {
    marginTop: theme.spacing.unit*2,
    ...postBodyStyles(theme)
  }
});

const SequencesHome = ({classes}) => {

  const { SingleColumnSection, SectionTitle, Divider, SequencesNewButton } = Components
  // TODO: decide on terms for community sequences
  return <React.Fragment>
    {/* Title */}
    <SingleColumnSection>
      <div className={classes.header}>
        <div className={classes.listTitle}>
          <Typography variant="h2" className={classes.library}>The Library</Typography>
        </div>
        {/* Description */}
        <Typography variant="body2" className={classes.listDescription}>
          Sequences are collections of posts that are curated by the community and
          are structured similarly to books. This is the place where you can find
          the best posts in easy to read formats.
        </Typography>
      </div>
    </SingleColumnSection>

    {getSetting('forumType') === 'LessWrong' && <SingleColumnSection>
      <SectionTitle title="Core Reading" />
      <Components.CoreReading />
      <Divider />
    </SingleColumnSection>}

    <SingleColumnSection>
      <SectionTitle title="Curated Sequences" />
      <div className={classes.sequencesGridWrapperWrapper}>
        <Components.SequencesGridWrapper
          terms={{'view':'curatedSequences', limit:12}}
          showAuthor={true}
          showLoadMore={true}
        />
      </div>
      <Divider />
    </SingleColumnSection>

    <SingleColumnSection>
      <SectionTitle  title="Community Sequences" >
        <SequencesNewButton />
      </SectionTitle>
      <div className={classes.sequencesGridWrapperWrapper}>
        <Components.SequencesGridWrapper
          terms={{'view':'communitySequences', limit:12}}
          listMode={true}
          showAuthor={true}
          showLoadMore={true}
        />
      </div>
    </SingleColumnSection>
  </React.Fragment>;
};

registerComponent(
  'SequencesHome',
  SequencesHome,
  withStyles(styles, {name: "SequencesHome"}),
  //withList(options)
);
