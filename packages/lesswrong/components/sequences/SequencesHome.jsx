import React, { PropTypes, Component } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { Link } from 'react-router';

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

const SequencesHome = ({document, currentUser, loading}) => {
  // TODO: decide on terms for community sequences
  return <div className="sequences-home">
    {/* Title */}
    <Components.Section>
      <div className="sequences-header">
        <div className="sequences-list-title">
          <h1>The Library</h1>
        </div>
        {/* Description */}
        <div className="sequences-list-description">
          Sequences are collections of posts that are curated by the community and
          are structured similarly to books. This is the place where you can find
          the best posts on LessWrong in easy to read formats.
        </div>
      </div>
    </Components.Section>
    {/* Curated collections tripartite */}
    <div className="sequences-list-curated-collections">
      <Components.Section contentStyle={{marginTop: '-20px'}} title="Core Reading">
        <Components.CollectionsCard collection={testCollections[0]} big={true} url={"/rationality"}/>
        <Components.CollectionsCard collection={testCollections[1]} float={"left"} url={"/codex"}/>
        <Components.CollectionsCard collection={testCollections[2]} float={"right"} url={"/hpmor"}/>
      </Components.Section>
    </div>
    {/* Other curated sequences grid (make a sequencesGrid component w/ flexbox) */}
    <div className="sequences-list-curated-sequences">
      <Components.Section title="Curated Sequences">
        <Components.SequencesGridWrapper
          terms={{'view':'curatedSequences', limit:12}}
          showAuthor={true}
          showLoadMore={true}
        className="community-sequences-grid" />
      </Components.Section>
    </div>
    {/* In-progress sequences grid (make a sequencesGrid component w/ flexbox)*/}
    {/*<div className="sequences-list-progress-sequences">
      <Components.Section title="In Progress Sequences">
        <Components.SequencesGridWrapper terms={communitySeqTerms} className="community-sequences-grid" />
      </Components.Section>
    </div> */}
    {/* Community sequences list (make a sequencesList w/ roll your own list) */}
    <div>
      <div className="sequences-list-community-sequences">
        <Components.Section title="Community Sequences" titleComponent={<div className="recent-posts-title-component users-profile-drafts">
          <div className="new-sequence-link"><Link to={"/sequencesnew"}> new sequence </Link></div>
        </div>}>
          <Components.SequencesGridWrapper
            terms={{'view':'communitySequences', limit:12}}
            listMode={true}
            showAuthor={true}
            showLoadMore={true}
          className="community-sequences-grid" />
        </Components.Section>
      </div>
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
  //withList(options)
);
