import React from "react";
import { forumSelect } from "../../lib/forumTypeUtils";
import { forumTypeSetting } from "../../lib/instanceSettings";
import { Components, registerComponent } from "../../lib/vulcan-lib";

const styles = (theme: ThemeType): JssStyles => ({
  razLargeVersion: {
    [theme.breakpoints.down("xs")]: {
      display: "none",
    },
  },
  razSmallVersion: {
    [theme.breakpoints.up("sm")]: {
      display: "none",
    },
  },
});

export interface CoreReadingCollection {
  title: string;
  id: string;
  userId: string;
  summary: string;
  imageId: string;
  color: string;
  big: boolean;
  url: string;
}

const isEAForum = forumTypeSetting.get() === "EAForum";

const coreReadingCollections: Array<CoreReadingCollection> = forumSelect({
  EAForum: [
    {
      title: "The EA Handbook",
      id: "handbook",
      userId: "jd3Bs7YAT2KqnLxYD",
      summary:
        "To help you learn the basics of effective altruism, we took some of the movement's best writing and made this handbook. Think of it as the textbook you'd get for a college course on EA. It explains the core ideas, so that you can start applying them to your own life.",
      imageId: "Banner/qnsx7lpxxfpf7tqxmnql",
      color: "#0c869b",
      big: true,
      url: "/handbook",
    },
    {
      title: "Replacing Guilt",
      id: "replacing-guilt",
      userId: "QNsCYAaKRdXZWKPmE",
      summary:
        "Nate Soares writes about replacing guilt with other feelings and finding better ways to self-motivate, so that you can build a better future without falling apart first.",
      imageId: "Banner/qnjqqba8qclypnkvdkqn",
      color: "#d0c9d5",
      big: false,
      url: "/s/a2LBRPLhvwB83DSGq",
    },
    {
      title: "Most Important Century",
      id: "most-important",
      userId: "9Fg4woeMPHoGa6kDA",
      summary: `Holden Karnofsky argues that there is a good chance of a productivity explosion by 2100, which could quickly lead to a "technologically mature" civilization.`,
      imageId: "jacob-mejicanos-P6s8EbcSgmA-unsplash.jpg",
      color: "#d96704",
      big: false,
      url: "/s/isENJuPdB3fhjWYHd",
    },
  ],
  LessWrong: [
    {
      title: "Rationality: A-Z",
      id: "dummyId",
      userId: "nmk3nLpQE89dMRzzN",
      summary:
        "A set of essays by Eliezer Yudkowsky that serve as a long-form introduction to formative ideas behind Less Wrong, the Machine Intelligence Research Institute, the Center for Applied Rationality, and substantial parts of the effective altruism community.",
      imageId: "dVXiZtw_xrmvpm.png",
      color: "#B1D4B4",
      big: true,
      url: "/rationality",
    },
    {
      title: "The Codex",
      id: "dummyId2",
      userId: "XgYW5s8njaYrtyP7q",
      summary:
        "The Codex contains essays about science, medicine, philosophy, politics, and futurism. (There’s also one post about hallucinatory cactus-people, but it’s not representative)",
      imageId: "ItFKgn4_rrr58y.png",
      color: "#88ACB8",
      big: false,
      url: "/codex",
    },
    {
      title: "Harry Potter and the Methods of Rationality",
      id: "dummyId3",
      userId: "nmk3nLpQE89dMRzzN",
      summary:
        "What if Harry Potter was a scientist? What would you do if the universe had magic in it? A story that illustrates many rationality concepts.",
      imageId: "uu4fJ5R_zeefim.png",
      color: "#757AA7",
      big: false,
      url: "/hpmor",
    },
  ],
  ProgressForum: [
    {
      title: "A new philosophy of progress",
      id: "progress-philosophy",
      userId: "vvHZTqAQBJmRopLah",
      summary:
        "The 19th century believed in progress; the 20th century grew skeptical. We need a new way forward.",
      imageId: "banner/Nicolas_de_Condorcet_apejac.jpg",
      color: "#0c869b",
      big: true,
      url: "/posts/iTJHGrFRuHYX4HotJ"
    },
    {
      title: "Industrial literacy",
      id: "industrial-literacy",
      userId: "vvHZTqAQBJmRopLah",
      summary:
        "When you know these facts of history, you understand what “industrial civilization” is and why it is the benefactor of everyone who is lucky enough to live in it.",
      imageId: "banner/1280px-Smokestacks_3958_dg2z32.jpg",
      color: "#d0c9d5",
      big: false,
      url: "/posts/iTJHGrFRuHYX4HotJ",
    },
    {
      title: "Progress studies as a civic duty",
      id: "progress-civic-duty",
      userId: "vvHZTqAQBJmRopLah",
      summary: "We have a responsibility to learn the underpinnings of the standard of living we all enjoy. To understand and appreciate how we got here, and what it took. And ultimately, to keep it going",
      imageId: "banner/scotus-building_rappgq.jpg",
      color: "#d96704",
      big: false,
      url: "/posts/iTJHGrFRuHYX4HotJ",
    },
  ],
  default: [],
});

const CoreReading = ({ minimal = false, classes }: { minimal?: boolean; classes: ClassesType }) => (
  <Components.CollectionsCardContainer>
    <div className={classes.razLargeVersion}>
      <Components.BigCollectionsCard collection={coreReadingCollections[0]} url={coreReadingCollections[0].url} />
    </div>
    <div className={classes.razSmallVersion}>
      <Components.CollectionsCard collection={coreReadingCollections[0]} url={coreReadingCollections[0].url} />
    </div>

    {!minimal && (
      <Components.CollectionsCard collection={coreReadingCollections[1]} url={coreReadingCollections[1].url} />
    )}
    {!minimal && (
      <Components.CollectionsCard
        collection={coreReadingCollections[2]}
        url={coreReadingCollections[2].url}
        mergeTitle={!isEAForum}
      />
    )}
  </Components.CollectionsCardContainer>
);

const CoreReadingComponent = registerComponent("CoreReading", CoreReading, { styles });

declare global {
  interface ComponentTypes {
    CoreReading: typeof CoreReadingComponent;
  }
}
