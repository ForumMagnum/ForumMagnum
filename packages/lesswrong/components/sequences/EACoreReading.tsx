import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import type { CoreReadingCollection } from './LWCoreReading';
import CollectionsCardContainer from "../collections/CollectionsCardContainer";
import BigCollectionsCard from "../collections/BigCollectionsCard";
import CollectionsCard from "../collections/CollectionsCard";

const styles = (theme: ThemeType) => ({
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

const coreReadingCollections: Array<CoreReadingCollection> = 
  [
    {
      title: "The EA Handbook",
      id: "handbook",
      userId: "syx2QxGnDXhsr9tRi",
      summary: "To help you learn the basics of effective altruism, we took some of the movement's best writing and made this handbook. Think of it as the textbook you'd get for a college course on EA. It explains the core ideas, so that you can start applying them to your own life.",
      imageId: "Banner/qnsx7lpxxfpf7tqxmnql",
      color: "#0c869b",
      big: true,
      url: '/handbook'
    },
    {
      title: "Replacing Guilt",
      id: "replacing-guilt",
      userId: "QNsCYAaKRdXZWKPmE",
      summary: "Nate Soares writes about replacing guilt with other feelings and finding better ways to motivate yourself, so you can build a better future without falling apart.",
      imageId: "Banner/qnjqqba8qclypnkvdkqn",
      color: "#d0c9d5",
      big: false,
      url: '/s/a2LBRPLhvwB83DSGq'
    },
    {
      title: "Most Important Century",
      id: "most-important",
      userId: "9Fg4woeMPHoGa6kDA",
      summary: "Holden Karnofsky argues that we may be living in the most important century ever — a time when our decisions could shape the future for billions of years to come.",
      imageId: "jacob-mejicanos-P6s8EbcSgmA-unsplash.jpg",
      color: "#d96704",
      big: false,
      url: '/s/isENJuPdB3fhjWYHd',
    }
  ]

const EACoreReading = ({minimal=false, classes}: {
  minimal?: boolean,
  classes: ClassesType<typeof styles>,
}) => (
  <CollectionsCardContainer>
    <div className={classes.razLargeVersion}>
      <BigCollectionsCard collection={coreReadingCollections[0]} url={coreReadingCollections[0].url}/>
    </div>
    <div className={classes.razSmallVersion}>
      <CollectionsCard collection={coreReadingCollections[0]} url={coreReadingCollections[0].url}/>
    </div>

    {!minimal && <CollectionsCard collection={coreReadingCollections[1]} url={coreReadingCollections[1].url}/>}
    {!minimal && <CollectionsCard collection={coreReadingCollections[2]} url={coreReadingCollections[2].url} mergeTitle={false} />}
  </CollectionsCardContainer>
);

export default registerComponent("EACoreReading", EACoreReading, {styles});


