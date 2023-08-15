import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useCurrentUser } from "../common/withUser";
import { SECTION_WIDTH } from "../common/SingleColumnSection";
import classNames from "classnames";
import { useSingle } from "../../lib/crud/withSingle";
import { siteImageSetting } from "../vulcan-core/App";

// Slightly smaller than in the designs, but
const MAX_WIDTH = 1400;
const MD_WIDTH = 1000;
const DIVIDER_MARGIN = 48;

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    flexDirection: "row",
    maxWidth: `min(${MAX_WIDTH}px, 100%)`,
    marginLeft: "auto",
    marginRight: "auto",
    padding: "32px 16px",
    position: "relative",
    zIndex: theme.zIndexes.singleColumnSection,
    [theme.breakpoints.up("md")]: {
      width: MD_WIDTH,
    },
    [theme.breakpoints.up("lg")]: {
      width: MAX_WIDTH,
    },
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column",
    },
  },
  column: {
    "& > *:not(:last-child)::after": {
      content: '""',
      display: "block",
      height: "1px",
      backgroundColor: "#BECBD7",
      margin: `${DIVIDER_MARGIN}px 0`,
    },
  },
  leftColumn: {
    flex: "17 1 0%",
  },
  divider: {
    // 1px in size whether horizontal or vertical
    flex: "0 0 1px",
    backgroundColor: "#BECBD7",
    margin: `0 ${DIVIDER_MARGIN}px`,
    [theme.breakpoints.down("sm")]: {
      margin: `${DIVIDER_MARGIN}px 0`,
    },
  },
  rightColumn: {
    flex: "10 1 0%",
  },
  heading: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: "24px",
    fontWeight: 600,
    marginTop: 0,
  },
  gridSection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
  },
  listSection: {
    display: "flex",
    flexDirection: "column",
  },
  // List item
  postListItem: {
    display: "flex",
    width: "100%",
    borderRadius: theme.borderRadius.default,
    background: theme.palette.panelBackground.default,
    padding: '16px 16px',
    marginBottom: 16,
    alignItems: "center",
  },
  postListItemTextSection: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    maxHeight: 160,
  },
  postListItemTitle: {
    
  },
  postListItemMeta: {
    
  },
  postListItemPreview: {
    position: "relative",
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 3,
  },
  postListItemImage: {
    width: 160,
    height: 140,
    objectFit: "cover",
    borderRadius: theme.borderRadius.default,
  }
});

const featuredCollectionsSequenceIds = [
  "HSA8wsaYiqdt4ouNF", // First Decade Winners
  "isENJuPdB3fhjWYHd", // Most important century
  "a2LBRPLhvwB83DSGq", // Replacing guilt
];
const bestOfYearPostIds = [
  "Qk3hd6PrFManj8K6o", // Rethink's welfare range estimates
  "jgspXC8GKA7RtxMRE", // On living without idols
  "8c7LycgtkypkgYjZx", // AGI and the EMH
];
const learnAboutEACollectionIds = [
  "MobebwWs2o86cS9Rd", // Handbook
];
const learnAboutEASequenceIds = [
  "NKTk9s4tZPiA4aySj", // EA Archives reading list
  "dg852CXinRkieekxZ", // Classic posts (from the digest)
];
const introToCauseAreasSequenceIds = [
  "vtmN9g6C57XbqPrZS", // AI risk
  "hnEu2fKLQ9wTRJ9Zc", // Global health and development
  "KWvPuGeFyb5aMdHgK", // Animal welfare
  "JuwQwdLugR63ux2P8", // Biosecurity
  "aH5to3as8yiQA6wGo", // Intro to moral philosophy
  "pFageBjmsLra3ucDC", // Intro to cause prioritization
];

const popularThisMonthPostIds = ["z8ZWwm4xeHBAiLZ6d", "Doa69pezbZBqrcucs", "kHDjtqSiSohZAQyjG", "8qXrou57tMGz8cWCL"];
// TODO this one might be tricky
const featuredAudioPostIds = ["jk7A3NMdbxp65kcJJ", "rXYW9GPsmwZYu3doX", "ffmbLCzJctLac3rDu"];

const PostListItem = ({ documentId, classes }: { documentId: string; classes: ClassesType }) => {
  const { Loading, PostsItemMeta } = Components;

  const { document, loading } = useSingle({
    documentId,
    collectionName: "Posts",
    fragmentName: "PostsListBestOfPage",
  });

  if (loading) return <Loading />;

  if (!document) return null;
  
  const highlight =  document.customHighlight?.html || document.contents?.htmlHighlight;

  return <div className={classes.postListItem}>
    {/* TODO make post item component which matches designs */}
    <div className={classes.postListItemTextSection}>
      <div className={classes.postListItemTitle}>
        {document.title}
      </div>
      <div className={classes.postListItemMeta}>
        {/* <PostsItemMeta post={document} /> */}
        TODO
      </div>
      <div className={classes.postListItemPreview} dangerouslySetInnerHTML={{ __html: highlight ?? ''}}>
      </div>
    </div>
    <img className={classes.postListItemImage} src={document.socialPreviewData.imageUrl || siteImageSetting.get()} />
  </div>
};

const CollectionCard = ({ documentId, classes }: { documentId: string; classes: ClassesType }) => {
  const { Loading } = Components;

  const { document, loading } = useSingle({
    documentId,
    collectionName: "Collections",
    fragmentName: "CollectionsPageFragment",
  });

  if (loading) return <Loading />;

  if (!document) return null;

  return <>TODO</>;
};

const SequenceCard = ({ documentId, classes }: { documentId: string; classes: ClassesType }) => {
  const { Loading } = Components;

  const { document, loading } = useSingle({
    documentId,
    collectionName: "Sequences",
    fragmentName: "SequencesPageFragment",
  });

  if (loading) return <Loading />;

  if (!document) return null;
  
  return <>TODO</>;
};

const AudioPostCard = ({ documentId, classes }: { documentId: string; classes: ClassesType }) => {
  const { Loading } = Components;

  const { document, loading } = useSingle({
    documentId,
    collectionName: "Posts",
    fragmentName: "PostsListWithVotes",
  });

  if (loading) return <Loading />;

  if (!document) return null;
  
  return <>TODO</>;
};

const EABestOfPage = ({ classes }: { classes: ClassesType }) => {
  const currentUser = useCurrentUser();

  const { HeadTags } = Components;

  return (
    <>
      <HeadTags title="Best of the Forum" />
      <div className={classes.root}>
        <div className={classNames(classes.column, classes.leftColumn)}>
          <div>
            <h2 className={classes.heading}>Featured Collections</h2>
            <div className={classes.gridSection}>
              {featuredCollectionsSequenceIds.map((documentId) => (
                <CollectionCard key={documentId} documentId={documentId} classes={classes} />
              ))}
            </div>
          </div>
          <div>
            <h2 className={classes.heading}>Best Posts This Year</h2>
            <div className={classes.listSection}>
              {bestOfYearPostIds.map((documentId) => (
                <PostListItem key={documentId} documentId={documentId} classes={classes} />
              ))}
            </div>
          </div>
          <div>
            <h2 className={classes.heading}>Learn about Effective Altruism</h2>
            <div className={classes.gridSection}>
              {learnAboutEACollectionIds.map((documentId) => (
                <CollectionCard key={documentId} documentId={documentId} classes={classes} />
              ))}
              {learnAboutEASequenceIds.map((documentId) => (
                <SequenceCard key={documentId} documentId={documentId} classes={classes} />
              ))}
            </div>
          </div>
          <div>
            <h2 className={classes.heading}>Intro to Cause Areas</h2>
            <div className={classes.gridSection}>
              {introToCauseAreasSequenceIds.map((documentId) => (
                <SequenceCard key={documentId} documentId={documentId} classes={classes} />
              ))}
            </div>
          </div>
        </div>
        <div className={classes.divider} />
        <div className={classNames(classes.column, classes.rightColumn)}>
          <div>
            <h2 className={classes.heading}>Popular This Month</h2>
            <div className={classes.listSection}>
              {popularThisMonthPostIds.map((documentId) => (
                <PostListItem key={documentId} documentId={documentId} classes={classes} />
              ))}
            </div>
          </div>
          <div>
            <h2 className={classes.heading}>Featured Audio Versions</h2>
            <div className={classes.listSection}>
              {featuredAudioPostIds.map((documentId) => (
                <AudioPostCard key={documentId} documentId={documentId} classes={classes} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const EABestOfPageComponent = registerComponent("EABestOfPage", EABestOfPage, { styles });

declare global {
  interface ComponentTypes {
    EABestOfPage: typeof EABestOfPageComponent;
  }
}
