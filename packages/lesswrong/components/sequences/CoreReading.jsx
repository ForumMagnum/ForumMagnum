import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import Hidden from '@material-ui/core/Hidden';
import { withStyles } from '@material-ui/core/styles';

const coreReadingCollections = [
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
    summary: "What if Harry was a scientist? What would you do if the universe had magic in it? A story that illustrates many rationality concepts.",
    imageId: "uu4fJ5R_zeefim.png",
    color: "#757AA7",
    big: false,
  }
]

const styles = theme => ({
  fullWidth: {
    width: "100%",
  },
});

const CoreReading = ({minimal=false, classes}) => (
  <Components.CollectionsCardContainer>
    <Hidden xsDown implementation="css" className={classes.fullWidth}>
      <Components.BigCollectionsCard collection={coreReadingCollections[0]} url={"/rationality"}/>
    </Hidden>
    <Hidden smUp implementation="css">
      <Components.CollectionsCard collection={coreReadingCollections[0]} url={"/rationality"}/>
    </Hidden>
    
    {!minimal && <Components.CollectionsCard collection={coreReadingCollections[1]} url={"/codex"}/>}
    {!minimal && <Components.CollectionsCard collection={coreReadingCollections[2]} url={"/hpmor"} mergeTitle={true} />}
  </Components.CollectionsCardContainer>
);

registerComponent("CoreReading", CoreReading,
  withStyles(styles, {name: "CoreReading"}));
