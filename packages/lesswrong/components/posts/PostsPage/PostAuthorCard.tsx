import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { Link } from '../../../lib/reactRouterWrapper';
import { truncate } from '../../../lib/editor/ellipsize';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { Typography } from "../../common/Typography";
import { ContentStyles } from "../../common/ContentStyles";
import { NewConversationButton } from "../../messaging/NewConversationButton";
import { SubscribeTo } from "../../notifications/NotifyMeButton";
import { CloudinaryImage2 } from "../../common/CloudinaryImage2";

const styles = (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.grey[100],
    padding: '15px 30px 20px',
    margin: '30px 0',
  },
  about: {
    fontSize: 13
  },
  usernameRow: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: 10,
    rowGap: '10px',
    alignItems: 'center',
    marginTop: 6,
  },
  photoLink: {
    '&:hover': {
      opacity: 1
    }
  },
  photo: {
    borderRadius: '50%',
    margin: '4px 0'
  },
  username: {
    flex: '1 1 0',
    whiteSpace: 'nowrap',
    fontWeight: 'bold',
    paddingRight: 20
  },
  btns: {
    display: 'flex',
    columnGap: 10,
  },
  messageBtn: {
    display: 'block',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.grey[0],
    fontFamily: theme.typography.fontFamily,
    border: theme.palette.border.normal,
    borderColor: theme.palette.primary.main,
    borderRadius: 4,
    padding: '8px 16px',
  },
  subscribeBtn: {
    backgroundColor: theme.palette.grey[0],
    color: theme.palette.primary.main,
    fontFamily: theme.typography.fontFamily,
    border: theme.palette.border.normal,
    borderColor: theme.palette.primary.main,
    borderRadius: 4,
    padding: '8px 16px',
  },
  bio: {
    marginTop: 20,
  },
});

const PostAuthorCardInner = ({author, currentUser, classes}: {
  author: PostsAuthors_user,
  currentUser: UsersCurrent|null,
  classes: ClassesType<typeof styles>,
}) => {
    return <AnalyticsContext pageSectionContext="postAuthorCard">
    <div className={classes.root}>
      <Typography variant="subheading" component="div" className={classes.about}>About the author</Typography>
      <div className={classes.usernameRow}>
        {isFriendlyUI && author.profileImageId && <Link
          to={`/users/${author.slug}?from=post_author_card`}
          className={classes.photoLink}
        >
          <CloudinaryImage2
            height={40}
            width={40}
            imgProps={{q: '100'}}
            publicId={author.profileImageId}
            className={classes.photo}
          />
        </Link>}
        <Typography variant="headline" component="div" className={classes.username}>
          <Link to={`/users/${author.slug}?from=post_author_card`}>
            {author.displayName}
          </Link>
        </Typography>
        <div className={classes.btns}>
          {currentUser?._id !== author._id && <NewConversationButton
            user={author}
            currentUser={currentUser}
            from="post_author_card"
          >
            <a tabIndex={0} className={classes.messageBtn}>
              Message
            </a>
          </NewConversationButton>}
          {currentUser?._id !== author._id && <SubscribeTo
            document={author}
            className={classes.subscribeBtn}
            subscribeMessage="Subscribe"
            unsubscribeMessage="Unsubscribe"
            asButton
          />}
        </div>
      </div>
      {author.htmlBio && <ContentStyles contentType="comment" className={classes.bio}>
        <div dangerouslySetInnerHTML={{__html: truncate(author.htmlBio, 100, 'words')}} />
      </ContentStyles>}
    </div>
  </AnalyticsContext>
}

export const PostAuthorCard = registerComponent("PostAuthorCard", PostAuthorCardInner, {styles});

declare global {
  interface ComponentTypes {
    PostAuthorCard: typeof PostAuthorCard
  }
}
