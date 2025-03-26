import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useUpdate } from '../../lib/crud/withUpdate';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper'
import { useCurrentUser } from '../common/withUser';
import { useHover } from '../common/withHover'
import withErrorBoundary from '../common/withErrorBoundary'
import * as _ from 'underscore';
import classNames from 'classnames';
import { isFriendlyUI } from '@/themes/forumTheme';

const styles = (theme: ThemeType) => ({
  audioIcon: {
    width: 14,
    height: 14,
    color: theme.palette.grey[500],
    position: "relative",
    top: 2
  },
  postTitle: isFriendlyUI ? {} : {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    fontSize: "1rem",
    fontWeight: 500,
  },
  titleWithCurationNotice: isFriendlyUI ? {} : {
    color: 'green',
    fontWeight: 600,
  },
});

const SunshineCuratedSuggestionsItem = ({classes, post, setCurationPost, timeForCuration}: {
  classes: ClassesType<typeof styles>,
  post: SunshineCurationPostsList,
  setCurationPost?: (post: SunshineCurationPostsList) => void,
  timeForCuration?: boolean,
}) => {
  const currentUser = useCurrentUser();
  const { CurationNoticesItem, SunshineListItem, SidebarHoverOver, Typography, PostsHighlight, SidebarInfo, SidebarAction, SidebarActionMenu, ForumIcon, FormatDate } = Components

  const { hover, anchorEl, eventHandlers } = useHover();
  const { mutate: updatePost } = useUpdate({
    collectionName: "Posts",
    fragmentName: 'SunshineCurationPostsList',
  });

  const handleCurate = () => {
    void updatePost({
      selector: {_id: post._id},
      data: {
        reviewForCuratedUserId: currentUser!._id,
        curatedDate: new Date(),
      }
    })
  }

  const handleDisregardForCurated = () => {
    void updatePost({
      selector: {_id: post._id},
      data: {
        reviewForCuratedUserId: currentUser!._id,
      }
    })
  }

  const handleSuggestCurated = () => {
    let suggestUserIds = _.clone(post.suggestForCuratedUserIds) || []
    if (!suggestUserIds.includes(currentUser!._id)) {
      suggestUserIds.push(currentUser!._id)
    }
    void updatePost({
      selector: {_id: post._id},
      data: {suggestForCuratedUserIds:suggestUserIds}
    })
  }

  const handleUnsuggestCurated = () => {
    let suggestUserIds = _.clone(post.suggestForCuratedUserIds) || []
    if (suggestUserIds.includes(currentUser!._id)) {
      suggestUserIds = _.without(suggestUserIds, currentUser!._id);
    }
    void updatePost({
      selector: {_id: post._id},
      data: {suggestForCuratedUserIds:suggestUserIds}
    })
  }

  const hasCurationNotice = post.curationNotices && post.curationNotices.length > 0

  return (
    <span {...eventHandlers}>
      <SunshineListItem hover={hover}>
        <SidebarHoverOver hover={hover} anchorEl={anchorEl} >
          <Typography variant="title">
            <Link to={postGetPageUrl(post)}>
              { post.title }
            </Link>
          </Typography>
          <br/>
          {!post.curatedDate && post.curationNotices.map(curationNotice => <CurationNoticesItem key={curationNotice._id} curationNotice={curationNotice}/>)}
          <PostsHighlight post={post} maxLengthWords={600}/>
        </SidebarHoverOver>
        <Link to={postGetPageUrl(post)}
          className={classNames(classes.postTitle, {
            [classes.titleWithCurationNotice]: !!(post.curationNotices.length > 0),
          })}
        >
            {post.title}
        </Link>
        <div>
          <SidebarInfo>
            { post.baseScore }
          </SidebarInfo>
          <SidebarInfo>
            <Link to={userGetProfileUrl(post.user)}>
                {post.user && post.user.displayName}
            </Link>
          </SidebarInfo>
          {post.postedAt && <SidebarInfo>
            <FormatDate date={post.postedAt}/>
          </SidebarInfo>}
          {post.podcastEpisodeId &&
            <ForumIcon icon="VolumeUp" className={classes.audioIcon} />
          }
        </div>
        <SidebarInfo>
          Endorsed by { post.suggestForCuratedUsernames }
        </SidebarInfo>
        { hover && <SidebarActionMenu>
          { setCurationPost && 
            <SidebarAction title="Write Curation Notice" onClick={() => setCurationPost(post)}>
              <ForumIcon icon="Shortform"/>
            </SidebarAction>
          }
          { !post.suggestForCuratedUserIds || !post.suggestForCuratedUserIds.includes(currentUser!._id) ?
            <SidebarAction title="Endorse Curation" onClick={handleSuggestCurated}>
              <ForumIcon icon="PlusOne"/>
            </SidebarAction>
            :
            <SidebarAction title="Unendorse Curation" onClick={handleUnsuggestCurated}>
              <ForumIcon icon="Undo"/>
            </SidebarAction>
          }
          { timeForCuration &&
            <SidebarAction title="Curate Post" onClick={handleCurate}>
              <ForumIcon icon="Star" />
            </SidebarAction>
          }
          <SidebarAction title="Remove from Curation Suggestions" onClick={handleDisregardForCurated}>
            <ForumIcon icon="Clear"/>
          </SidebarAction>
        </SidebarActionMenu>}
      </SunshineListItem>
    </span>
  )
}

const SunshineCuratedSuggestionsItemComponent = registerComponent('SunshineCuratedSuggestionsItem', SunshineCuratedSuggestionsItem, {styles, 
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    SunshineCuratedSuggestionsItem: typeof SunshineCuratedSuggestionsItemComponent
  }
}
