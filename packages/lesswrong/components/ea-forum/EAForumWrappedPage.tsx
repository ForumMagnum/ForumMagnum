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
    query getUserMostRead($year: Int!) {
      UserMostReadByYear(year: $year) {
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
      }
    }
  `, {
    variables: {
      year: 2022
    },
    ssr: true,
  })
  console.log('data', data)
  
  const { SingleColumnSection, Typography } = Components
  
  if (showAnimation || loading) {
    return <img src="https://res.cloudinary.com/cea/image/upload/c_crop,w_350,h_350,e_loop:0/v1672107610/wrapped_animation_01.gif" className={classes.loadingGif}/>
  }

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
              {data?.UserMostReadByYear?.mostReadAuthors?.map(author => {
                return <div key={author.slug}>
                  <Link to={`/user/${author.slug}`}>{author.displayName} ({author.count})</Link>
                </div>
              })}
            </div>
            <div>Most read topics</div>
            <div>
              {data?.UserMostReadByYear?.mostReadTopics?.map(topic => {
                return <div key={topic.slug}>
                  <Link to={`/topics/${topic.slug}`}>{topic.name} ({topic.count})</Link>
                </div>
              })}
            </div>
            <div>Your posts and comments</div>
            <div>
              2 posts, 15 comments
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
