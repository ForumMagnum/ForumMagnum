import React, { Component } from 'react';
import PropTypes from 'prop-types';
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

const testCollections = [
  {
    title: "Rationality: A-Z",
    id: "dummyId",
    user: {userName: "Eliezer_Yudkowsky", displayName: "EliezerYudkowsky", slug: "eliezer_yudkowsky"},
    summary: 'A set of essays by Eliezer Yudkowsky that serve as a long-form introduction to formative ideas behind Less Wrong, the Machine Intelligence Research Institute, the Center for Applied Rationality, and substantial parts of the effective altruism community.',
    imageId: "dVXiZtw_xrmvpm.png",
    color: "#B1D4B4",
    big: true,
  },
  {
    title: "The Codex",
    id: "dummyId2",
    user: {username: "Yvain", displayName: "Scott Alexander", slug: "yvain"},
    summary: "The Codex contains essays about science, medicine, philosophy, politics, and futurism. (There’s also one post about hallucinatory cactus-people, but it’s not representative)",
    imageId: "ItFKgn4_rrr58y.png",
    color: "#88ACB8",
    big: false,
  },
  {
    title: "Harry Potter and the Methods of Rationality",
    id: "dummyId3",
    user: {userName: "Eliezer_Yudkowsky", displayName: "EliezerYudkowsky", slug: "eliezer_yudkowsky"},
    summary: "In an Alternate Universe, Petunia married a scientist. Now Rationalist!Harry enters the wizarding world armed with Enlightenment ideals and the experimental spirit.",
    imageId: "uu4fJ5R_zeefim.png",
    color: "#757AA7",
    big: false,
  }
]

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
      <Components.CollectionsCardContainer>
        <Components.BigCollectionsCard collection={testCollections[0]} url={"/rationality"}/>
        <Components.CollectionsCard collection={testCollections[1]} url={"/codex"}/>
        <Components.CollectionsCard collection={testCollections[2]} url={"/hpmor"}/>
      </Components.CollectionsCardContainer>
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
