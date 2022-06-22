import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { userHasPingbacks } from '../../../lib/betas';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { useCurrentUser } from '../../common/withUser';
import { MAX_COLUMN_WIDTH } from './PostsPage';
import { Link } from '../../../lib/reactRouterWrapper';

const HIDE_POST_BOTTOM_VOTE_WORDCOUNT_LIMIT = 300

const styles = (theme: ThemeType): JssStyles => ({
  footerSection: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '1.4em'
  },
  voteBottom: {
    position: 'relative',
    fontSize: 42,
    textAlign: 'center',
    display: 'inline-block',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginBottom: 40
  },
  bottomNavigation: {
    width: 640,
    margin: 'auto',
    [theme.breakpoints.down('sm')]: {
      width:'100%',
      maxWidth: MAX_COLUMN_WIDTH
    }
  },
  footerTagList: {
    marginTop: 16,
    marginBottom: 66,
  },
  authorCard: {
    backgroundColor: theme.palette.grey[100],
    padding: '15px 30px 20px',
    margin: '30px 0',
  },
  authorCardAbout: {
    
  },
  authorCardUsernameRow: {
    display: 'flex',
    columnGap: 14,
    justifyContent: 'space-between',
    marginTop: 6,
  },
  authorCardUsername: {
    flex: '1 1 0',
    // cursor: 'pointer',
    // '&:hover': {
    //   borderBottom: ''
    // }
  },
  authorCardBio: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[800],
    fontSize: 14,
    lineHeight: '1.8em',
    display: '-webkit-box',
    "-webkit-line-clamp": 3,
    "-webkit-box-orient": 'vertical',
    overflow: 'hidden',
    marginTop: 12,
  },
});

const PostsPagePostFooter = ({post, sequenceId, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  sequenceId: string,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { PostsVote, BottomNavigation, PingbacksList, FooterTagList, Typography, NewConversationButton } = Components;
  const wordCount = post.contents?.wordCount || 0
  
  return <>
    {!post.shortform && !post.isEvent && (wordCount > HIDE_POST_BOTTOM_VOTE_WORDCOUNT_LIMIT) && <AnalyticsContext pageSectionContext="tagFooter">
      <div className={classes.footerTagList}>
        <FooterTagList post={post}/>
      </div>
    </AnalyticsContext>}
    {!post.shortform && (wordCount > HIDE_POST_BOTTOM_VOTE_WORDCOUNT_LIMIT) &&
      <div className={classes.footerSection}>
        <div className={classes.voteBottom}>
          <AnalyticsContext pageSectionContext="lowerVoteButton">
            <PostsVote post={post} />
          </AnalyticsContext>
        </div>
      </div>}
    {sequenceId && <div className={classes.bottomNavigation}>
      <AnalyticsContext pageSectionContext="bottomSequenceNavigation">
        <BottomNavigation post={post}/>
      </AnalyticsContext>
    </div>}

    {userHasPingbacks(currentUser) && <AnalyticsContext pageSectionContext="pingbacks">
      <PingbacksList postId={post._id}/>
    </AnalyticsContext>}
    
    {post.user?.showPostAuthorCard && <div className={classes.authorCard}>
      <Typography variant="subheading" component="div" className={classes.authorCardAbout}>About the author</Typography>
      <div className={classes.authorCardUsernameRow}>
        <Typography variant="headline" className={classes.authorCardUsername}>
          <Link to={`/users/${post.user.slug}`}>{post.user.displayName}</Link>
        </Typography>
        {currentUser?._id != post.user._id && <NewConversationButton user={post.user} currentUser={currentUser}>
          Message
        </NewConversationButton>}
      </div>
      {post.user.biography?.html && <div className={classes.authorCardBio}><div dangerouslySetInnerHTML={{__html: post.user.biography?.html}} /></div>}
    </div>}
  </>
}

const PostsPagePostFooterComponent = registerComponent("PostsPagePostFooter", PostsPagePostFooter, {styles});

declare global {
  interface ComponentTypes {
    PostsPagePostFooter: typeof PostsPagePostFooterComponent
  }
}
