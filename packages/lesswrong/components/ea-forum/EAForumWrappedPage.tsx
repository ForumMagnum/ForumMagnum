import React from "react"
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { Link } from "../../lib/reactRouterWrapper";
import { useCurrentUser } from "../common/withUser";


const styles = (theme: ThemeType) => ({
  root: {
    
  },
  summaryCard: {
    maxWidth: 640,
    // backgroundColor: theme.palette.primary.main,
    background: `linear-gradient(to bottom right, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
    color: theme.palette.grey[0],
    padding: 40,
    borderRadius: 12,
    margin: '0 auto'
  },
  headline: {
    textAlign: 'center',
    color: theme.palette.grey[0],
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
  
  const { SingleColumnSection, Typography } = Components

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
              <div>Lizka</div>
            </div>
            <div>Most read topics</div>
            <div>
              <div>AI Risk</div>
              <div>Forecasting</div>
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
