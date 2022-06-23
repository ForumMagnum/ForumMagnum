import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { userHasPingbacks } from '../../../lib/betas';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { useCurrentUser } from '../../common/withUser';
import { MAX_COLUMN_WIDTH } from './PostsPage';
import { Link } from '../../../lib/reactRouterWrapper';
import { forumTypeSetting } from '../../../lib/instanceSettings';

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
    fontSize: 13
  },
  authorCardUsernameRow: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: 10,
    rowGap: '10px',
    alignItems: 'center',
    marginTop: 6,
  },
  authorCardPhoto: {
    borderRadius: '50%',
    margin: '4px 0'
  },
  authorCardUsername: {
    flex: '1 1 0',
    whiteSpace: 'nowrap',
    fontWeight: 'bold',
    paddingRight: 20
  },
  authorCardBtns: {
    display: 'flex',
    columnGap: 10,
  },
  authorCardMessageBtn: {
    display: 'block',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.grey[0],
    fontFamily: theme.typography.fontFamily,
    border: theme.palette.border.normal,
    borderColor: theme.palette.primary.main,
    borderRadius: 4,
    padding: '8px 16px',
  },
  authorCardSubscribeBtn: {
    backgroundColor: theme.palette.grey[0],
    color: theme.palette.primary.main,
    fontFamily: theme.typography.fontFamily,
    border: theme.palette.border.normal,
    borderColor: theme.palette.primary.main,
    borderRadius: 4,
    padding: '8px 16px',
  },
  authorCardBio: {
    fontSize: 14,
    display: '-webkit-box',
    "-webkit-line-clamp": 3,
    "-webkit-box-orient": 'vertical',
    overflow: 'hidden',
    marginTop: 20,
  },
});

const PostsPagePostFooter = ({post, sequenceId, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  sequenceId: string,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { PostsVote, BottomNavigation, PingbacksList, FooterTagList, Typography, ContentStyles,
    NewConversationButton, NotifyMeButton, CloudinaryImage2 } = Components;
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
    
    {!post.isEvent && post.user?.showPostAuthorCard && <AnalyticsContext pageSectionContext="postAuthorCard">
      <div className={classes.authorCard}>
        <Typography variant="subheading" component="div" className={classes.authorCardAbout}>About the author</Typography>
        <div className={classes.authorCardUsernameRow}>
          {forumTypeSetting.get() === 'EAForum' && post.user.profileImageId && <CloudinaryImage2
            height={40}
            width={40}
            imgProps={{q: '100'}}
            publicId={post.user.profileImageId}
            className={classes.authorCardPhoto}
          />}
          <Typography variant="headline" component="div" className={classes.authorCardUsername}>
            <Link to={`/users/${post.user.slug}?from=post_author_card`}>{post.user.displayName}</Link>
          </Typography>
          <div className={classes.authorCardBtns}>
            {currentUser?._id != post.user._id && <NewConversationButton
              user={post.user}
              currentUser={currentUser}
              from="post_author_card"
            >
              <a tabIndex={0} className={classes.authorCardMessageBtn}>
                Message
              </a>
            </NewConversationButton>}
            {currentUser?._id != post.user._id && <NotifyMeButton
              document={post.user}
              className={classes.authorCardSubscribeBtn}
              subscribeMessage="Subscribe"
              unsubscribeMessage="Unsubscribe"
              asButton
            />}
          </div>
        </div>
        {post.user.biography?.html && <ContentStyles contentType="comment">
          <div dangerouslySetInnerHTML={{__html: post.user.biography?.html}} className={classes.authorCardBio} />
        </ContentStyles>}
      </div>
    </AnalyticsContext>}
  </>
}

const PostsPagePostFooterComponent = registerComponent("PostsPagePostFooter", PostsPagePostFooter, {styles});

declare global {
  interface ComponentTypes {
    PostsPagePostFooter: typeof PostsPagePostFooterComponent
  }
}
