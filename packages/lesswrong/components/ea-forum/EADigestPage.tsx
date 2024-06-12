import React, { CSSProperties } from "react";
import { Components, fragmentTextForQuery, registerComponent } from "../../lib/vulcan-lib";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { useMulti } from "../../lib/crud/withMulti";
import moment from "moment";
import { useLocation } from "@/lib/routeUtil";
import { gql, useQuery } from "@apollo/client";
import { useCurrentUser } from "../common/withUser";
import { Link } from "@/lib/reactRouterWrapper";
import { useMessages } from "../common/withMessages";
import { useUpdateCurrentUser } from "../hooks/useUpdateCurrentUser";
import { digestLink } from "./EABestOfPage";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    justifyItems: 'end',
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.text.alwaysWhite,
    padding: '30px 30px 60px',
    marginTop: -30,
    marginBottom: -165,
    [theme.breakpoints.down("sm")]: {
      display: 'block',
      paddingTop: 50,
      paddingLeft: 20,
      paddingRight: 20,
      marginLeft: -8,
      marginRight: -8,
    }
  },
  topSection: {
    maxWidth: 765,
    padding: '10px 3px 26px'
  },
  pageTitle: {
    display: 'flex',
    columnGap: '20px',
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 32,
    fontWeight: 700,
    marginTop: 0,
    marginBottom: 6,
  },
  previewLabel: {
    color: theme.palette.grey[300],
    fontSize: 20,
    fontWeight: 500,
    marginLeft: 16,
  },
  subscribeTooltip: {
  },
  subscribeIcon: {
    opacity: 0.7,
    cursor: 'pointer'
  },
  success: {
    display: 'flex',
    alignItems: 'center',
    columnGap: 10,
    fontSize: 13,
    lineHeight: '19px',
    color: theme.palette.grey[800],
    textWrap: 'pretty',
  },
  successCheckIcon: {
    color: theme.palette.icon.greenCheckmark
  },
  successLink: {
    color: theme.palette.primary.main
  },
  pageDescription: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 16,
    fontWeight: 500,
    lineHeight: "150%",
  },
  feedback: {
    fontWeight: 500,
    fontStyle: "italic",
    fontSize: 14,
    marginTop: 10,
    opacity: 0.8,
    "& a": {
      textDecoration: 'underline',
      '&:hover': {
        textDecoration: 'underline',
      }
    },
  },
  heading: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 20,
    fontWeight: 700,
    marginTop: 0,
    marginBottom: 20,
  },
  imageFade: {
    background: `
      linear-gradient(
        90deg,
        var(--digest-background) 0%,
        var(--digest-background) 50%,
        ${theme.palette.greyAlpha(0)} 80%
      );
    `,
    position: "fixed",
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
    [theme.breakpoints.down("xs")]: {
      background: `
      linear-gradient(
        135deg,
        var(--digest-background) 0%,
        var(--digest-background) 50%,
        ${theme.palette.greyAlpha(0)} 80%
      );
    `,
    }
  },
  image: {
    position: "fixed",
    top: 0,
    right: 0,
    width: '50%',
    height: '100%',
    objectFit: 'cover',
    zIndex: -2,
  },
});

const digestPostsQuery = gql`
  query getDigestPosts($num: Int) {
    DigestPosts(num: $num) {
      ...PostsListWithVotes
    }
  }
  ${fragmentTextForQuery('PostsListWithVotes')}
`

const EADigestPage = ({ classes }: { classes: ClassesType<typeof styles> }) => {
  const currentUser = useCurrentUser()
  const updateCurrentUser = useUpdateCurrentUser()
  const { params } = useLocation()
  const { flash } = useMessages()
  const digestNum = parseInt(params.num)
  
  // get the digest based on the num from the URL
  const {results, loading: digestLoading} = useMulti({
    terms: {
      view: "findByNum",
      num: digestNum
    },
    collectionName: "Digests",
    fragmentName: 'DigestsMinimumInfo',
    limit: 1,
    skip: !digestNum
  })
  const digest = results?.[0]
  
  // get the list of posts in this digest
  const { data, loading } = useQuery(digestPostsQuery, {
      ssr: true,
      skip: !digestNum || !digest,
      variables: {num: digestNum},
    }
  )
  
  const onSubscribeClick = async () => {
    if (currentUser) {
      try {
        await updateCurrentUser({
          subscribedToDigest: true
        })
        flash({messageString: (
          <div className={classes.success}>
            <ForumIcon icon="CheckCircle" className={classes.successCheckIcon} />
            <div>
              Thanks for signing up! You can edit your subscription via
              your <Link to={'/account?highlightField=subscribedToDigest'} className={classes.successLink}>
                account settings
              </Link>.
            </div>
          </div>
        )})
      } catch(e) {
        flash('There was a problem subscribing you to the digest. Please try again later.')
      }
    }
  }
  
  const {
    Error404, HeadTags, PostsLoading, EAPostsItem, CloudinaryImage2, ForumIcon, LWTooltip
  } = Components;
  
  // TODO: Probably we'll want to check the publishedDate instead of the endDate, but we haven't been using it.
  // If we do start using it, we'll need to backfill the publishedDate values and update this condition.
  const isPublished = digest && digest.endDate
  
  // 404 if there is no matching digest, or if the matching one is still in progress and the user is not an admin
  if ((!digest && !digestLoading) || (!isPublished && !currentUser?.isAdmin)) {
    return <Error404 />
  }

  const posts: PostsListWithVotes[] = data?.DigestPosts
  
  const postsList = loading ? (
    <PostsLoading placeholderCount={20} viewType="card" />
  ) : posts?.map((post) => (
    <EAPostsItem
      key={post._id}
      viewType="card"
      post={post}
      showKarma={false}
    />
  ))
  
  // Define background color with a CSS variable to be accessed in the styles
  const style = {
    "--digest-background": digest?.onsitePrimaryColor,
  } as CSSProperties;
  
  // Hide the icon if this is a logged in user who is already subscribed to the digest
  let subscribeNode = null
  if (!currentUser || !currentUser.subscribedToDigest) {
    subscribeNode = <LWTooltip
      title="Click to subscribe to the weekly email version of this digest"
      className={classes.subscribeTooltip}
    >
      {currentUser ? <ForumIcon
          icon="Envelope"
          className={classes.subscribeIcon}
          onClick={onSubscribeClick}
        /> : <Link to={digestLink} target="_blank" rel="noopener noreferrer">
          <ForumIcon icon="Envelope" className={classes.subscribeIcon} />
        </Link>
      }
    </LWTooltip>
  }

  return (
    <>
      <HeadTags title={`EA Forum Digest #${params.num}`} />
      <AnalyticsContext pageContext="DigestPage">
        <div className={classes.root} style={style}>
          <div className={classes.content}>
            <section className={classes.topSection}>
              <h1 className={classes.pageTitle}>
                <span>
                  EA Forum Digest #{params.num}
                  {!isPublished && <span className={classes.previewLabel}>[Preview]</span>}
                </span>
                {subscribeNode}
              </h1>
              {digest?.startDate && <div className={classes.pageDescription}>
                Highlights from the week of {moment(digest.startDate).format('MMMM D, YYYY')}
              </div>}
              <div className={classes.feedback}>
                This is an experiment - help us out by{" "}
                <Link
                  to="https://docs.google.com/forms/d/e/1FAIpQLSeiSgHs_a-dYt6XHFokRSxbU1uKW99V6gCD3w7eNOT27_HsMw/viewform"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  sharing your thoughts
                </Link>
              </div>
            </section>
            {postsList}
          </div>
          <div className={classes.imageFade}></div>
          {digest?.onsiteImageId && <CloudinaryImage2
            publicId={digest.onsiteImageId}
            className={classes.image}
          />}
        </div>
      </AnalyticsContext>
    </>
  );
};

const EADigestPageComponent = registerComponent(
  "EADigestPage",
  EADigestPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    EADigestPage: typeof EADigestPageComponent;
  }
}
