import React, { useMemo, useRef } from "react";
import { Components, registerComponent, slugify } from "../../lib/vulcan-lib";
import classNames from "classnames";
import { siteImageSetting } from "../vulcan-core/App";
import moment from "moment";
import { InteractionWrapper } from "../common/useClickableCell";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import { Link } from "../../lib/reactRouterWrapper";
import { isEAForum } from "../../lib/instanceSettings";
import { sequenceGetPageUrl } from "../../lib/collections/sequences/helpers";
import { collectionGetPageUrl } from "../../lib/collections/collections/helpers";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { useHover } from "../common/withHover";
import { useMulti } from "../../lib/crud/withMulti";
import keyBy from "lodash/keyBy";

const MAX_WIDTH = 1500;
const MD_WIDTH = 1000;
const DIVIDER_MARGIN = 48;

// For overlay on sequence and collection cards
const SEQUENCE_CARD_IMAGE_HEIGHT = 162;
const Z_IMAGE = 1;
const Z_OVERLAY = 2;

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    flexDirection: "row",
    maxWidth: `min(${MAX_WIDTH}px, 100%)`,
    marginLeft: "auto",
    marginRight: "auto",
    padding: "32px 32px",
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
    marginBottom: 2,
  },
  gridSection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gridGap: "16px",
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
    boxShadow: `/* The top layer shadow */
      -1px 1px 10px ${theme.palette.greyAlpha(0.15)},
      /* The second layer */
      -8px 8px 0 0px ${theme.palette.panelBackground.default},
      /* The second layer shadow */
      -10px 10px 10px -1px ${theme.palette.greyAlpha(0.15)}`,
  },
  sequenceCardImageWrapper: {
    position: "relative",
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
    position: "absolute",
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
    marginTop: 16,
  },
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

// TODO remove this in final version, I just wasn't sure about changing the social preview image an author set
const customPostImageUrls: Record<string, string> = {
  jgspXC8GKA7RtxMRE:
    "https://res.cloudinary.com/cea/image/upload/c_crop,g_custom/c_fill,dpr_auto,q_auto,f_auto,g_auto:faces/SocialPreview/cmg4r5baxggel7baxiw6",
};

// TODO do useMulti's with these to speed things up
const allPostIds = [...bestOfYearPostIds, ...popularThisMonthPostIds, ...featuredAudioPostIds];

const allSequenceIds = [...featuredCollectionsSequenceIds, ...learnAboutEASequenceIds, ...introToCauseAreasSequenceIds];

const allCollectionIds = [...learnAboutEACollectionIds];

const PostListItem = ({
  post,
  isNarrow = false,
  classes,
}: {
  post: PostsBestOfList;
  isNarrow?: boolean;
  classes: ClassesType;
}) => {
  const { TruncatedAuthorsList, ForumIcon } = Components;
  const authorExpandContainer = useRef(null);

  const { eventHandlers } = useHover({
    pageElementContext: "postListItem",
    documentId: post._id,
    documentSlug: post?.slug,
  });

  const postLink = post ? postGetPageUrl(post) : "";

  const timeFromNow = moment(new Date(post.postedAt)).fromNow();
  const ago = timeFromNow !== "now" ? <span className={classes.xsHide}>&nbsp;ago</span> : null;

  const imageUrl = post.socialPreviewData.imageUrl || customPostImageUrls[post._id] || siteImageSetting.get();

  return (
    <AnalyticsContext documentSlug={post?.slug ?? "unknown-slug"}>
      <div {...eventHandlers} className={classes.postListItem}>
        <div className={classes.postListItemTextSection}>
          <div className={classes.postListItemTitle}>
            <Link to={postLink}>{post.title}</Link>
          </div>
          <div className={classes.postListItemMeta}>
            <div ref={authorExpandContainer}>
              <InteractionWrapper>
                <TruncatedAuthorsList post={post} expandContainer={authorExpandContainer} />
              </InteractionWrapper>
            </div>
            &nbsp;·&nbsp;
            {timeFromNow}
            {ago}
            &nbsp;·&nbsp;
            {post.readTimeMinutes}m read
            <div>
              {!isNarrow && (
                <span className={classNames(classes.commentCount, classes.xsHide)}>
                  &nbsp;·&nbsp;
                  <Link to={`${postLink}#comments`} className={classes.commentCount}>
                    <ForumIcon icon="Comment" />
                    {post.commentCount}
                  </Link>
                </span>
              )}
            </div>
          </div>
          <div className={classes.postListItemPreview}>{post.contents?.plaintextDescription}</div>
        </div>
        <img className={classes.postListItemImage} src={imageUrl} />
      </div>
    </AnalyticsContext>
  );
};

const SequenceOrCollectionCard = ({
  title,
  author,
  postCount,
  readCount,
  imageId,
  href,
  eventHandlers,
  classes,
}: {
  title: string;
  author: UsersMinimumInfo | null;
  postCount: number;
  readCount: number;
  imageId: string;
  href: string;
  eventHandlers: {
    onMouseOver: (event: AnyBecauseTodo) => void;
    onMouseLeave: () => void;
  };
  classes: ClassesType;
}) => {
  const { CloudinaryImage2, UsersNameDisplay } = Components;

  const readProgress = `${readCount}/${postCount}`;

  return (
    <div {...eventHandlers} className={classes.sequenceCard}>
      <div className={classes.sequenceCardImageWrapper}>
        <CloudinaryImage2 publicId={imageId} className={classes.sequenceCardImage} />
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
  );
};

const CollectionCard = ({ collection, classes }: { collection: CollectionsBestOfFragment; classes: ClassesType }) => {
  const { eventHandlers } = useHover({
    pageElementContext: "collectionCard",
    documentId: collection._id,
    documentSlug: collection.slug,
  });

  const title = collection.title;
  const author = collection.user;

  const postCount = collection.postsCount;
  const readCount = collection.readPostsCount

  const imageId =
    // TODO JP-look-here
    collection.gridImageId || (isEAForum ? "Banner/yeldubyolqpl3vqqy0m6.jpg" : "sequences/vnyzzznenju0hzdv6pqb.jpg");
  const href = collectionGetPageUrl(collection);

  return (
    <AnalyticsContext documentSlug={collection?.slug ?? "unknown-slug"}>
      <SequenceOrCollectionCard
        title={title}
        author={author}
        postCount={postCount}
        readCount={readCount}
        imageId={imageId}
        href={href}
        eventHandlers={eventHandlers}
        classes={classes}
      />
    </AnalyticsContext>
  );
};

const SequenceCard = ({ sequence, classes }: { sequence: SequencesPageFragment; classes: ClassesType }) => {
  // Note: this is not a real slug, it's just so we can recognise the sequence in the analytics,
  // without risking any weirdness due to titles having spaces in them
  const slug = slugify(sequence?.title ?? "unknown-slug");

  const { eventHandlers } = useHover({
    pageElementContext: "sequenceCard",
    documentId: sequence._id,
    documentSlug: slug,
  });

  const title = sequence.title;
  const author = sequence.user;

  const postCount = sequence.postsCount;
  const readCount = sequence.readPostsCount;

  const imageId =
    sequence.gridImageId ||
    sequence.bannerImageId ||
    (isEAForum ? "Banner/yeldubyolqpl3vqqy0m6.jpg" : "sequences/vnyzzznenju0hzdv6pqb.jpg");
  const href = sequenceGetPageUrl(sequence);

  return (
    <AnalyticsContext documentSlug={slug}>
      <SequenceOrCollectionCard
        title={title}
        author={author}
        postCount={postCount}
        readCount={readCount}
        imageId={imageId}
        href={href}
        eventHandlers={eventHandlers}
        classes={classes}
      />
    </AnalyticsContext>
  );
};

const AudioPostCard = ({ post, classes }: { post: PostsBestOfList; classes: ClassesType }) => {
  const { PostsPodcastPlayer } = Components;

  const { eventHandlers } = useHover({
    pageElementContext: "audioCard",
    documentId: post._id,
    documentSlug: post.slug,
  });

  if (!post?.podcastEpisode) return null;

  return (
    <AnalyticsContext documentSlug={post?.slug ?? "unknown-slug"}>
      <div {...eventHandlers} className={classes.audioCard}>
        <PostsPodcastPlayer podcastEpisode={post.podcastEpisode} postId={post._id} hideIconList />
      </div>
    </AnalyticsContext>
  );
};

const EABestOfPage = ({ classes }: { classes: ClassesType }) => {
  const { HeadTags } = Components;

  const { results: posts, loading } = useMulti({
    terms: {postIds: allPostIds, limit: allPostIds.length},
    collectionName: "Posts",
    fragmentName: 'PostsBestOfList',
  });

  const { results: sequences, loading: sequencesLoading } = useMulti({
    terms: {sequenceIds: allSequenceIds, limit: allSequenceIds.length},
    collectionName: "Sequences",
    fragmentName: 'SequencesPageFragment',
  });

  const { results: collections, loading: collectionsLoading } = useMulti({
    terms: {collectionIds: allCollectionIds, limit: allCollectionIds.length},
    collectionName: "Collections",
    fragmentName: 'CollectionsBestOfFragment',
  });

  const postsById = useMemo(() => keyBy(posts, '_id'), [posts]);
  const sequencesById = useMemo(() => keyBy(sequences, '_id'), [sequences]);
  const collectionsById = useMemo(() => keyBy(collections, '_id'), [collections]);

  if (loading || sequencesLoading || collectionsLoading) return <Components.Loading />;

  const bestOfYearPosts = bestOfYearPostIds.map((id) => postsById[id]);
  const popularThisMonthPosts = popularThisMonthPostIds.map((id) => postsById[id]);
  const featuredAudioPosts = featuredAudioPostIds.map((id) => postsById[id]);
  const featuredCollectionSequences = featuredCollectionsSequenceIds.map((id) => sequencesById[id]);
  const learnAboutEASequences = learnAboutEASequenceIds.map((id) => sequencesById[id]);
  const learnAboutEACollections = learnAboutEACollectionIds.map((id) => collectionsById[id]);
  const introToCauseAreasSequences = introToCauseAreasSequenceIds.map((id) => sequencesById[id]);

  return (
    <>
      <HeadTags title="Best of the Forum" />
      <AnalyticsContext pageContext="eaBestOfPage">
        <div className={classes.root}>
          <div className={classNames(classes.column, classes.leftColumn)}>
            <AnalyticsContext pageSectionContext="featuredCollections">
              <div>
                <h2 className={classes.heading}>Featured collections</h2>
                <div className={classes.gridSection}>
                  {featuredCollectionSequences.map((sequence) => (
                    <SequenceCard key={sequence._id} sequence={sequence} classes={classes} />
                  ))}
                </div>
              </div>
            </AnalyticsContext>
            <AnalyticsContext pageSectionContext="bestPostsThisYear">
              <div>
                <h2 className={classes.heading}>Best posts this year</h2>
                <div className={classes.listSection}>
                  {bestOfYearPosts.map((post) => (
                    <PostListItem key={post._id} post={post} classes={classes} />
                  ))}
                </div>
              </div>
            </AnalyticsContext>
            <AnalyticsContext pageSectionContext="learnAboutEffectiveAltruism">
              <div>
                <h2 className={classes.heading}>Learn about Effective Altruism</h2>
                <div className={classes.gridSection}>
                  {learnAboutEACollections.map((collection) => (
                    <CollectionCard key={collection._id} collection={collection} classes={classes} />
                  ))}
                  {learnAboutEASequences.map((sequence) => (
                    <SequenceCard key={sequence._id} sequence={sequence} classes={classes} />
                  ))}
                </div>
              </div>
            </AnalyticsContext>
            <AnalyticsContext pageSectionContext="introToCauseAreas">
              <div>
                <h2 className={classes.heading}>Intro to cause areas</h2>
                <div className={classes.gridSection}>
                  {introToCauseAreasSequences.map((sequence) => (
                    <SequenceCard key={sequence._id} sequence={sequence} classes={classes} />
                  ))}
                </div>
              </div>
            </AnalyticsContext>
          </div>
          <div className={classes.divider} />
          <div className={classNames(classes.column, classes.rightColumn)}>
            <AnalyticsContext pageSectionContext="popularThisMonth">
              <div>
                <h2 className={classes.heading}>Popular this month</h2>
                <div className={classes.listSection}>
                  {popularThisMonthPosts.map((post) => (
                    <PostListItem key={post._id} post={post} classes={classes} isNarrow />
                  ))}
                </div>
              </div>
            </AnalyticsContext>
            <AnalyticsContext pageSectionContext="featuredAudio">
              <div>
                <h2 className={classes.heading}>Featured audio</h2>
                <div className={classes.listSection}>
                  {featuredAudioPosts.map((post) => (
                    <AudioPostCard key={post._id} post={post} classes={classes} />
                  ))}
                </div>
              </div>
            </AnalyticsContext>
          </div>
        </div>
      </AnalyticsContext>
    </>
  );
};

const EABestOfPageComponent = registerComponent("EABestOfPage", EABestOfPage, { styles });

declare global {
  interface ComponentTypes {
    EABestOfPage: typeof EABestOfPageComponent;
  }
}
