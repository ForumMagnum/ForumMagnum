import React, { ReactChild } from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  razLargeVersion: {
    [theme.breakpoints.down('xs')]: {
      display: "none",
    },
  },
  razSmallVersion: {
    [theme.breakpoints.up('sm')]: {
      display: "none",
    },
  },
});

export interface CoreReadingCollection {
  title: string,
  id: string,
  userId: string,
  summary: string|ReactChild,
  imageId: string,
  color: string,
  big: boolean,
  url: string,
}

const coreReadingCollections: Array<CoreReadingCollection> = 
  [
    {
      title: "Rationality: A-Z",
      id: "dummyId",
      userId: "nmk3nLpQE89dMRzzN",
      summary: <div>
        <p>
          LessWrong was founded by Eliezer Yudkowsky. For two years he wrote a blogpost a day about topics including rationality, science, ambition and artificial intelligence. Those posts have been edited down into this introductory collection, recommended reading for all Lesswrong users.
        </p>
        <p>(Also known as <Link to={"/tag/rationality-a-z-discussion-and-meta"}>"The Sequences.")</Link></p>
      </div>,
      imageId: "dVXiZtw_xrmvpm.png",
      color: "#B1D4B4",
      big: true,
      url: '/rationality',
    },
    {
      title: "The Codex",
      id: "dummyId2",
      userId: "XgYW5s8njaYrtyP7q",
      summary: "The Codex contains essays about science, medicine, philosophy, politics, and futurism. (There’s also one post about hallucinatory cactus-people, but it’s not representative)",
      imageId: "ItFKgn4_rrr58y.png",
      color: "#88ACB8",
      big: false,
      url: "/codex",
    },
    {
      title: "Harry Potter and the Methods of Rationality",
      id: "dummyId3",
      userId: "nmk3nLpQE89dMRzzN",
      summary: "What if Harry Potter was a scientist? What would you do if the universe had magic in it? A story that illustrates many rationality concepts.",
      imageId: "uu4fJ5R_zeefim.png",
      color: "#757AA7",
      big: false,
      url: "/hpmor",
    },
    {
      title: "Best of LessWrong",
      id: "dummyId3",
      userId: "nmk3nLpQE89dMRzzN",
      summary: "Each year, the LessWrong community reviews the best posts from the previous year, and votes on which of them have stood the tests of time.",
      imageId: "uu4fJ5R_zeefim.png",
      color: "#757AA7",
      big: false,
      url: "/best",
    },
    {
      title: "Sequence Highlights",
      id: "dummyId3",
      userId: "nmk3nLpQE89dMRzzN",
      summary: "The sequences are super long, no lie. That's why we made this short 40-post version you can actually finish in a weekend.",
      imageId: "uu4fJ5R_zeefim.png",
      color: "#757AA7",
      big: false,
      url: "/hpmor",
    }
  ]

const LWCoreReading = ({classes}: {
  minimal?: boolean,
  classes: ClassesType,
}) => {
  const { CollectionsCardContainer, BigCollectionsCard, CollectionsCard } = Components

  return <CollectionsCardContainer>
    <div className={classes.razLargeVersion}>
      <BigCollectionsCard collection={coreReadingCollections[0]} url={coreReadingCollections[0].url}/>
    </div>
    <div className={classes.razSmallVersion}>
      <CollectionsCard collection={coreReadingCollections[0]} url={coreReadingCollections[0].url}/>
    </div>

    <CollectionsCard collection={coreReadingCollections[1]} url={coreReadingCollections[1].url}/>
    <CollectionsCard collection={coreReadingCollections[2]} url={coreReadingCollections[2].url}/>
    <CollectionsCard collection={coreReadingCollections[3]} url={coreReadingCollections[3].url}/>
    <CollectionsCard collection={coreReadingCollections[4]} url={coreReadingCollections[4].url}/>



  </CollectionsCardContainer>
}

const LWCoreReadingComponent = registerComponent("LWCoreReading", LWCoreReading, {styles});

declare global {
  interface ComponentTypes {
    LWCoreReading: typeof LWCoreReadingComponent
  }
}
