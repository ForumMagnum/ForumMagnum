import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { Link } from 'react-router';
import { withStyles } from '@material-ui/core/styles';
import { legacyBreakpoints } from '../../lib/modules/utils/theme';

const styles = theme => ({
  root: {
    marginRight: 90,
    
    [theme.breakpoints.down('sm')]: {
      marginRight: 0,
    }
  },
  
  header: {
    paddingLeft: 20,
    marginBottom: 50,
  
    [legacyBreakpoints.maxTiny]: {
      paddingLeft: 0,
    }
  },
  
  listTitle: {
    fontWeight: "bold",
    textTransform: "uppercase",
    borderTopStyle: "solid",
    borderTopWidth: 4,

    "& h1": {
      marginTop: 7,
    }
  },
  
  listDescription: {
    fontSize: 20,
    marginTop: 30,
    lineHeight: 1.25,
  },
});

const SequencesHome = ({document, currentUser, loading, classes}) => {
  // TODO: decide on terms for community sequences
  return <div className={classes.root}>
    {/* Title */}
    <Components.Section>
      <div className={classes.header}>
        <div className={classes.listTitle}>
          <h1>The Library</h1>
        </div>
        {/* Description */}
        <div className={classes.listDescription}>
          Sequences are collections of posts that are curated by the community and
          are structured similarly to books. This is the place where you can find
          the best posts on LessWrong in easy to read formats.
        </div>
      </div>
    </Components.Section>
    {/* Curated collections tripartite */}
    <Components.Section title="Core Reading">
      <Components.CoreReading />
    </Components.Section>
    {/* Other curated sequences grid (make a sequencesGrid component w/ flexbox) */}
    <Components.Section title="Curated Sequences">
      <Components.SequencesGridWrapper
        terms={{'view':'curatedSequences', limit:12}}
        showAuthor={true}
        showLoadMore={true}
      />
    </Components.Section>
    {/* In-progress sequences grid (make a sequencesGrid component w/ flexbox)*/}
    {/* <Components.Section title="In Progress Sequences">
          <Components.SequencesGridWrapper terms={communitySeqTerms} />
        </Components.Section> */}
    {/* Community sequences list (make a sequencesList w/ roll your own list) */}
    <div>
      <Components.Section title="Community Sequences" titleComponent={<div className="recent-posts-title-component users-profile-drafts">
        <Components.SectionSubtitle>
          <Link to={"/sequencesnew"}> new sequence </Link>
        </Components.SectionSubtitle>
      </div>}>
        <Components.SequencesGridWrapper
          terms={{'view':'communitySequences', limit:12}}
          listMode={true}
          showAuthor={true}
          showLoadMore={true}
        />
      </Components.Section>
    </div>

  </div>;
};

// const options = {
//   collection: Sequences,
//   fragmentName: 'SequenceListFragment'
// };

registerComponent(
  'SequencesHome',
  SequencesHome,
  withStyles(styles, {name: "SequencesHome"}),
  //withList(options)
);
