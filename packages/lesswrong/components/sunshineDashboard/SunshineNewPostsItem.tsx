import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useUpdate } from '../../lib/crud/withUpdate';
import { useMutation } from '@apollo/client';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper'
import { useCurrentUser } from '../common/withUser';
import { useHover } from '../common/withHover'
import withErrorBoundary from '../common/withErrorBoundary';
import Button from '@material-ui/core/Button';
import gql from 'graphql-tag';
import PersonIcon from '@material-ui/icons/Person'
import HomeIcon from '@material-ui/icons/Home';
import ClearIcon from '@material-ui/icons/Clear';
import { postHighlightStyles } from '../../themes/stylePiping'

const styles = (theme: ThemeType): JssStyles => ({
  icon: {
    width: 14,
    marginRight: 4
  },
  buttonRow: {
    ...theme.typography.commentStyle
  },
  post: {
    ...postHighlightStyles(theme)
  },
  title: {
    borderTop: "solid 1px rgba(0,0,0,.1)",
    paddingTop: 12,
    marginTop: 12
  },
  moderation: {
    marginBottom: 12
  }
})

const SunshineNewPostsItem = ({post, classes}: {
  post: SunshinePostsList,
  classes: ClassesType
}) => {
  const [selectedTags, setSelectedTags] = useState<Record<string,boolean>>({});
  const currentUser = useCurrentUser();
  const {eventHandlers, hover, anchorEl} = useHover();
  
  const {mutate: updatePost} = useUpdate({
    collectionName: "Posts",
    fragmentName: 'PostsList',
  });
  const [addTagsMutation] = useMutation(gql`
    mutation addTagsMutation($postId: String, $tagIds: [String]) {
      addTags(postId: $postId, tagIds: $tagIds)
    }
  `);

  const applyTags = () => {
    const tagsApplied: Array<string> = [];
    for (let tagId of Object.keys(selectedTags)) {
      if (selectedTags[tagId])
        tagsApplied.push(tagId);
    }
    void addTagsMutation({
      variables: {
        postId: post._id,
        tagIds: tagsApplied,
      }
    });
  }
  
  const handleReview = () => {
    applyTags();
    void updatePost({
      selector: { _id: post._id},
      data: {
        reviewedByUserId: currentUser!._id,
        authorIsUnreviewed: false
      },
    })
  }

  const handlePromote = () => {
    applyTags();
    
    void updatePost({
      selector: { _id: post._id},
      data: {
        frontpageDate: new Date(),
        reviewedByUserId: currentUser!._id,
        authorIsUnreviewed: false
      },
    })
  }
  
  const handleDelete = () => {
    if (confirm("Are you sure you want to move this post to the author's draft?")) {
      applyTags();
      window.open(userGetProfileUrl(post.user), '_blank');
      void updatePost({
        selector: { _id: post._id},
        data: {
          draft: true,
        }
      })
    }
  }

  const { MetaInfo, LinkPostMessage, ContentItemBody, SunshineListItem, SidebarHoverOver, SidebarInfo, CoreTagsChecklist, FooterTagList, Typography } = Components
  const { html: modGuidelinesHtml = "" } = post.moderationGuidelines || {}
  const { html: userGuidelinesHtml = "" } = post.user?.moderationGuidelines || {}

  const moderationSection = post.moderationStyle || post.user?.moderationStyle || modGuidelinesHtml || userGuidelinesHtml

  return (
    <span {...eventHandlers}>
      <SunshineListItem hover={hover}>
        <SidebarHoverOver hover={hover} anchorEl={anchorEl}>
          <CoreTagsChecklist post={post} onSetTagsSelected={(selectedTags) => {
            setSelectedTags(selectedTags);
          }}/>
          <FooterTagList post={post} />
          <div className={classes.buttonRow}>
              <Button onClick={handleReview}>
                <PersonIcon className={classes.icon} /> Personal
              </Button>
              {post.submitToFrontpage && <Button onClick={handlePromote}>
                <HomeIcon className={classes.icon} /> Frontpage
              </Button>}
              <Button onClick={handleDelete}>
                <ClearIcon className={classes.icon} /> Draft
              </Button>
            </div>
            <Typography variant="title" className={classes.title}>
              <Link to={postGetPageUrl(post)}>
                { post.title }
              </Link>
            </Typography>
            {moderationSection && <div className={classes.moderation}>
              {(post.moderationStyle || post.user?.moderationStyle) && <div>
                <MetaInfo>
                  <span>Mod Style: </span>
                  { post.moderationStyle || post.user?.moderationStyle }
                  {!post.moderationStyle && post.user?.moderationStyle && <span> (Default User Style)</span>}
                </MetaInfo>
              </div>}
              {(modGuidelinesHtml || userGuidelinesHtml) && <div>
                <MetaInfo>
                  <span dangerouslySetInnerHTML={{__html: modGuidelinesHtml || userGuidelinesHtml}}/>
                  {!modGuidelinesHtml && userGuidelinesHtml && <span> (Default User Guideline)</span>}
                </MetaInfo>
              </div>}
            </div>}
            <div className={classes.post}>
              <LinkPostMessage post={post} />
              <ContentItemBody dangerouslySetInnerHTML={{__html: post.contents?.html || ""}} description={`post ${post._id}`}/>
            </div>
        </SidebarHoverOver>
        <Link to={postGetPageUrl(post)}>
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
        </div>
      </SunshineListItem>
    </span>
  )
}

const SunshineNewPostsItemComponent = registerComponent('SunshineNewPostsItem', SunshineNewPostsItem, {styles, 
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    SunshineNewPostsItem: typeof SunshineNewPostsItemComponent
  }
}
