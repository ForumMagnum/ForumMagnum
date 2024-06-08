import React, { CSSProperties } from "react";
import { Components, fragmentTextForQuery, registerComponent } from "../../lib/vulcan-lib";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { useMulti } from "../../lib/crud/withMulti";
import moment from "moment";
import { useLocation } from "@/lib/routeUtil";
import { gql, useQuery } from "@apollo/client";

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
    maxWidth: 480,
    padding: '10px 3px 20px'
  },
  pageTitle: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 32,
    fontWeight: 700,
    marginTop: 0,
    marginBottom: 12,
  },
  pageDescription: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 16,
    fontWeight: 500,
    lineHeight: "150%",
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
  const { params } = useLocation()
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
  
  const {
    Error404, HeadTags, PostsLoading, EAPostsItem, CloudinaryImage2
  } = Components;
  
  if (!digest && !digestLoading) {
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

  return (
    <>
      <HeadTags title={`EA Forum Digest #${params.num}`} />
      <AnalyticsContext pageContext="DigestPage">
        <div className={classes.root} style={style}>
          <div className={classes.content}>
            <section className={classes.topSection}>
              <h1 className={classes.pageTitle}>EA Forum Digest #{params.num}</h1>
              {digest?.startDate && <div className={classes.pageDescription}>
                Highlights from the week of {moment(digest.startDate).format('MMMM DD, YYYY')}
              </div>}
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
