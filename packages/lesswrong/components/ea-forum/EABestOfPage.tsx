import React, { useRef } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useCurrentUser } from "../common/withUser";
import classNames from "classnames";
import { useSingle } from "../../lib/crud/withSingle";
import { siteImageSetting } from "../vulcan-core/App";
import moment from "moment";
import { InteractionWrapper } from "../common/useClickableCell";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import { Link } from "../../lib/reactRouterWrapper";
import { isEAForum } from "../../lib/instanceSettings";
import { sequenceGetPageUrl } from "../../lib/collections/sequences/helpers";
import { collectionGetPageUrl } from "../../lib/collections/collections/helpers";

// Slightly smaller than in the designs, but
const MAX_WIDTH = 1500;
const MD_WIDTH = 1000;
const DIVIDER_MARGIN = 48;

// For overlay on sequence and collection cards
const SEQUENCE_CARD_IMAGE_HEIGHT = 162;
const Z_IMAGE = 1
const Z_OVERLAY = 2

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
    [theme.breakpoints.down("md")]: {
      flexDirection: "column",
    },
    [theme.breakpoints.down("xs")]: {
      padding: "32px 4px",
    },
  },
  column: {
    "& > *:not(:last-child)::after": {
      content: '""',
      display: "block",
      height: "1px",
      backgroundColor: theme.palette.grey[400],
      margin: `${DIVIDER_MARGIN}px 0 ${DIVIDER_MARGIN}px 0`,
    },
  },
  leftColumn: {
    flex: "17 1 0%",
    minWidth: 0, // Magic flexbox property to prevent overflow, see https://stackoverflow.com/a/66689926
  },
  rightColumn: {
    flex: "10 1 0%",
    minWidth: 0, // Magic flexbox property to prevent overflow, see https://stackoverflow.com/a/66689926
  },
  divider: {
    // 1px in size whether horizontal or vertical
    flex: "0 0 1px",
    backgroundColor: theme.palette.grey[400],
    margin: `0 ${DIVIDER_MARGIN}px`,
    [theme.breakpoints.down("md")]: {
      margin: `${DIVIDER_MARGIN}px 0`,
    },
  },
  heading: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: "24px",
    fontWeight: 600,
    marginTop: 0,
    marginBottom: 2
  },
  gridSection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gridGap: '16px',
    // grid layout needs extra padding because the gridGap only applies between items
    // , and it has to be padding not margin because margin overlap is allowed
    paddingTop: 16,
  },
  listSection: {
    display: "flex",
    flexDirection: "column",
  },
  xsHide: {
    [theme.breakpoints.down("xs")]: {
      display: "none",
    },
  },
  // Post list item
  postListItem: {
    display: "flex",
    width: "100%",
    borderRadius: theme.borderRadius.default,
    background: theme.palette.panelBackground.default,
    padding: "16px 16px",
    marginTop: 16,
  },
  postListItemTextSection: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    display: "flex",
    flexDirection: "column",
    fontWeight: 500,
    flex: 1,
    maxHeight: 160,
    minWidth: 0, // Magic flexbox property to prevent overflow, see https://stackoverflow.com/a/66689926
    marginRight: 8,
  },
  postListItemTitle: {
    fontSize: 18,
    marginBottom: 8,
    lineHeight: "25px",
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
  },
  postListItemMeta: {
    display: "flex",
    marginBottom: 8,
    fontSize: 14,
    lineHeight: "20px",
    color: theme.palette.grey[600],
  },
  commentCount: {
    minWidth: 58,
    marginLeft: 4,
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    "& svg": {
      height: 18,
      marginRight: 1,
    },
    "&:hover": {
      color: theme.palette.grey[800],
      opacity: 1,
    },
  },
  postListItemPreview: {
    fontSize: 14,
    lineHeight: "20px",
    color: theme.palette.grey[600],
    position: "relative",
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 3,
    marginTop: "auto",
    marginBottom: "auto",
  },
  postListItemImage: {
    height: 140,
    maxWidth: 150,
    objectFit: "cover",
    borderRadius: theme.borderRadius.default,
    [theme.breakpoints.down("xs")]: {
      display: "none",
    },
  },
  // Sequence or collection card
  sequenceCard: {
    borderRadius: theme.borderRadius.default,
    background: theme.palette.panelBackground.default,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 500,
    marginLeft: 8, // Account for box shadow
    boxShadow:
      `/* The top layer shadow */
      -1px 1px 10px ${theme.palette.greyAlpha(0.15)},
      /* The second layer */
      -8px 8px 0 0px ${theme.palette.panelBackground.default},
      /* The second layer shadow */
      -10px 10px 10px -1px ${theme.palette.greyAlpha(0.15)}`
  },
  sequenceCardImageWrapper: {
    position: 'relative',
  },
  sequenceCardImage: {
    width: "100%",
    height: SEQUENCE_CARD_IMAGE_HEIGHT,
    objectFit: "cover",
    borderTopLeftRadius: theme.borderRadius.default,
    borderTopRightRadius: theme.borderRadius.default,
    zIndex: Z_IMAGE,
  },
  sequenceReadProgress: {
    position: 'absolute',
    zIndex: Z_OVERLAY,
    fontSize: 12,
    top: 8,
    left: 8,
    borderRadius: 14,
    backgroundColor: theme.palette.panelBackground.translucent3,
    padding: "6px 8px",
  },
  sequenceCardText: {
    padding: 16,
  },
  sequenceCardTitle: {
    fontSize: 18,
    lineHeight: "20px",
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
    marginBottom: 6,
  },
  sequenceCardMeta: {
    fontSize: 14,
    lineHeight: "20px",
    color: theme.palette.grey[600],
  },
  // Featured audio card
  audioCard: {
    marginTop: 16
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
const popularThisMonthPostIds = [
  "z8ZWwm4xeHBAiLZ6d", // Thoughts on far-UVC
  "Doa69pezbZBqrcucs", // Shaping Humanity's Longterm Trajectory
  "kHDjtqSiSohZAQyjG", // Some thoughts on quadratic funding
  "8qXrou57tMGz8cWCL", // Are education interventions as cost effective as the top health interventions?
];
const featuredAudioPostIds = [
  "jk7A3NMdbxp65kcJJ", // 500 million, but not a single one more
  "rXYW9GPsmwZYu3doX", // What happens on the average day?
  "ffmbLCzJctLac3rDu", // StrongMinds should not be a top rated charity (yet)
];

const PostListItem = ({
  documentId,
  isNarrow = false,
  classes,
}: {
  documentId: string;
  isNarrow?: boolean;
  classes: ClassesType;
}) => {
  const { Loading, TruncatedAuthorsList, ForumIcon } = Components;
  const authorExpandContainer = useRef(null);

  const { document, loading } = useSingle({
    documentId,
    collectionName: "Posts",
    fragmentName: "PostsPage",
  });

  const postLink = document ? postGetPageUrl(document) : "";

  if (loading) return <Loading />;

  if (!document) return null;

  const timeFromNow = moment(new Date(document.postedAt)).fromNow();
  const ago = timeFromNow !== "now" ? <span className={classes.xsHide}>&nbsp;ago</span> : null;

  return (
    <div className={classes.postListItem}>
      <div className={classes.postListItemTextSection}>
        <div className={classes.postListItemTitle}>
          <Link to={postLink}>{document.title}</Link>
        </div>
        <div className={classes.postListItemMeta}>
          <div ref={authorExpandContainer}>
            <InteractionWrapper>
              <TruncatedAuthorsList post={document} expandContainer={authorExpandContainer} />
            </InteractionWrapper>
          </div>
          &nbsp;·&nbsp;
          {timeFromNow}
          {ago}
          &nbsp;·&nbsp;
          {document.readTimeMinutes}m read
          <div>
            {!isNarrow && (
              <span className={classNames(classes.commentCount, classes.xsHide)}>
                &nbsp;·&nbsp;
                <Link to={`${postLink}#comments`} className={classes.commentCount}>
                  <ForumIcon icon="Comment" />
                  {document.commentCount}
                </Link>
              </span>
            )}
          </div>
        </div>
        <div className={classes.postListItemPreview}>{document.contents?.plaintextDescription}</div>
      </div>
      <img className={classes.postListItemImage} src={document.socialPreviewData.imageUrl || siteImageSetting.get()} />
    </div>
  );
};

const SequenceOrCollectionCard = ({
  title,
  author,
  postCount,
  readCount,
  imageId,
  href,
  classes,
}: {
  title: string;
  author: UsersMinimumInfo | null;
  postCount: number;
  readCount: number;
  imageId: string;
  href: string;
  classes: ClassesType;
}) => {
  const { CloudinaryImage2, UsersNameDisplay } = Components;

  const readProgress = `${readCount}/${postCount}`

  return <div className={classes.sequenceCard}>
    <div className={classes.sequenceCardImageWrapper}>
      <CloudinaryImage2
        publicId={imageId}
        className={classes.sequenceCardImage}
      />
      <div className={classes.sequenceReadProgress}>{readProgress}</div>
    </div>
    <div className={classes.sequenceCardText}>
      <Link to={href} className={classes.sequenceCardTitle}>
        {title}
      </Link>
      <div className={classes.sequenceCardMeta}>
        <UsersNameDisplay user={author} />
        {" · "}
        {postCount} posts
      </div>
    </div>
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

  const title = document.title;
  const author = document.user;

  const books = document.books;
  const chapters = books.flatMap((book) => book.sequences.flatMap((sequence) => sequence.chapters));
  const posts = chapters.flatMap((chapter) => chapter.posts);
  const postCount = posts.length;
  const readCount = posts.filter((post) => post.isRead).length;

  const imageId =
    document.gridImageId ||
    (isEAForum ? "Banner/yeldubyolqpl3vqqy0m6.jpg" : "sequences/vnyzzznenju0hzdv6pqb.jpg");
  const href = collectionGetPageUrl(document);

  return (
    <SequenceOrCollectionCard
      title={title}
      author={author}
      postCount={postCount}
      readCount={readCount}
      imageId={imageId}
      href={href}
      classes={classes}
    />
  );
};

const SequenceCard = ({ documentId, classes }: { documentId: string; classes: ClassesType }) => {
  const { Loading } = Components;

  const { document, loading } = useSingle({
    documentId,
    collectionName: "Sequences",
    fragmentName: "SequencesPageWithChaptersFragment",
  });

  if (loading) return <Loading />;

  if (!document) return null;

  const title = document.title;
  const author = document.user;

  const chapters = document.chapters;
  const posts = chapters.flatMap((chapter) => chapter.posts);
  const postCount = posts.length;
  const readCount = posts.filter((post) => post.isRead).length;

  const imageId =
    document.gridImageId ||
    document.bannerImageId ||
    (isEAForum ? "Banner/yeldubyolqpl3vqqy0m6.jpg" : "sequences/vnyzzznenju0hzdv6pqb.jpg");
  const href = sequenceGetPageUrl(document);

  return (
    <SequenceOrCollectionCard
      title={title}
      author={author}
      postCount={postCount}
      readCount={readCount}
      imageId={imageId}
      href={href}
      classes={classes}
    />
  );
};

const AudioPostCard = ({ documentId, classes }: { documentId: string; classes: ClassesType }) => {
  const { Loading, PostsPodcastPlayer } = Components;

  const { document, loading } = useSingle({
    documentId,
    collectionName: "Posts",
    fragmentName: "PostsPage",
  });

  if (loading) return <Loading />;

  if (!document) return null;

  return (
    <>
      {document.podcastEpisode && (
        <div className={classes.audioCard}>
          <PostsPodcastPlayer podcastEpisode={document.podcastEpisode} postId={document._id} hideIconList />
        </div>
      )}
    </>
  );
};

const EABestOfPage = ({ classes }: { classes: ClassesType }) => {
  const { HeadTags } = Components;

  return (
    <>
      <HeadTags title="Best of the Forum" />
      <div className={classes.root}>
        <div className={classNames(classes.column, classes.leftColumn)}>
          <div>
            <h2 className={classes.heading}>Featured collections</h2>
            <div className={classes.gridSection}>
              {featuredCollectionsSequenceIds.map((documentId) => (
                <SequenceCard key={documentId} documentId={documentId} classes={classes} />
              ))}
            </div>
          </div>
          <div>
            <h2 className={classes.heading}>Best posts this year</h2>
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
            <h2 className={classes.heading}>Intro to cause areas</h2>
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
            <h2 className={classes.heading}>Popular this month</h2>
            <div className={classes.listSection}>
              {popularThisMonthPostIds.map((documentId) => (
                <PostListItem key={documentId} documentId={documentId} classes={classes} isNarrow />
              ))}
            </div>
          </div>
          <div>
            <h2 className={classes.heading}>Featured audio</h2>
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
