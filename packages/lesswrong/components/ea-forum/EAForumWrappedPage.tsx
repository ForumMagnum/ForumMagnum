import React, { useEffect, useState } from "react"
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { Link } from "../../lib/reactRouterWrapper";
import { useCurrentUser } from "../common/withUser";
import { gql, useQuery } from "@apollo/client";


const styles = (theme: ThemeType) => ({
  root: {
    
  },
  loadingGif: {
    marginTop: -50
  },
  summaryCard: {
    maxWidth: 640,
    // backgroundColor: theme.palette.primary.main,
    // background: `linear-gradient(to bottom right, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
    // color: theme.palette.grey[0],
    padding: 40,
    // borderRadius: 12,
    borderTopLeftRadius: '255px 15px',
    borderTopRightRadius: '15px 225px',
    borderBottomRightRadius: '225px 15px',
    borderBottomLeftRadius: '15px 255px',
    border: `2px solid ${theme.palette.primary.main}`,
    margin: '0 auto'
  },
  headline: {
    textAlign: 'center',
    // color: theme.palette.grey[0],
    fontSize: 24,
    fontWeight: 600
  },
  summarySection: {
    maxWidth: 500,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridGap: '8px',
    fontFamily: theme.typography.fontFamily,
    margin: '20px auto 0'
  },
  
});

const EAForumWrappedPage = ({classes}: {classes: ClassesType}) => {
  const currentUser = useCurrentUser()
  const [showAnimation, setShowAnimation] = useState(true)
  
  // make sure the full 5 sec gif plays
  useEffect(() => {
    setTimeout(() => {
      setShowAnimation(false)
    }, 5000);
  }, []);
  
  const { data, loading } = useQuery(gql`
    query getWrappedData($year: Int!) {
      UserWrappedDataByYear(year: $year) {
        mostReadAuthors {
          displayName
          slug
          count
        }
        mostReadTopics {
          name
          slug
          count
        }
        postCount
        topPost {
          _id
          title
          slug
          baseScore
        }
        commentCount
        topComment {
          _id
          postId
          baseScore
        }
        shortformCount
        topShortform {
          _id
          postId
          baseScore
        }
      }
    }
  `, {
    variables: {
      year: 2022
    },
    ssr: true,
  })
  console.log('data', data)
  
  const { SingleColumnSection, Typography, HoverPreviewLink } = Components
  
  if (showAnimation || loading) {
    return <img src="https://res.cloudinary.com/cea/image/upload/c_crop,w_350,h_350,e_loop:0/v1672107610/wrapped_animation_01.gif" className={classes.loadingGif}/>
  }
  
  const results = data?.UserWrappedDataByYear

  return (
    <div className={classes.root}>
      <SingleColumnSection>
        <div className={classes.summaryCard}>
          <Typography variant="headline" className={classes.headline}>
            {currentUser?.displayName}'s ✨ 2022 EA Forum Wrapped ✨
          </Typography>
          
          <div className={classes.summarySection}>
            <div>Most read authors</div>
            <div>
              {results.mostReadAuthors.map(author => {
                return <div key={author.slug}>
                  <Link to={`/user/${author.slug}`}>{author.displayName} ({author.count})</Link>
                </div>
              })}
            </div>
            <div>Most read topics</div>
            <div>
              {results.mostReadTopics.map(topic => {
                return <div key={topic.slug}>
                  <HoverPreviewLink href={`/topics/${topic.slug}`} innerHTML={topic.name}/> ({topic.count})
                </div>
              })}
            </div>
            <div>Your top post</div>
            <div>
              <HoverPreviewLink
                href={`/posts/${results.topPost._id}/${results.topPost.slug}`}
                innerHTML={results.topPost.title}
              /> ({results.postCount} posts total)
            </div>
            <div>Your top comment</div>
            <div>
              <HoverPreviewLink
                href={`/posts/${results.topComment.postId}?commentId=${results.topComment._id}`}
                innerHTML="See comment"
              /> ({results.commentCount} comments total)
            </div>
            <div>Your top shortform</div>
            <div>
              <HoverPreviewLink
                href={`/posts/${results.topShortform.postId}?commentId=${results.topShortform._id}`}
                innerHTML="See shortform"
              /> ({results.shortformCount} shortforms total)
            </div>
            <div>Karma earned this year</div>
            <div>
              +123
            </div>
          </div>
        </div>
      </SingleColumnSection>
    </div>
  )
}

const EAForumWrappedPageComponent = registerComponent('EAForumWrappedPage', EAForumWrappedPage, {styles})

declare global {
  interface ComponentTypes {
    EAForumWrappedPage: typeof EAForumWrappedPageComponent
  }
}
