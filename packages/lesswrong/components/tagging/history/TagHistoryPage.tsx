import React from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useTagBySlug } from '../useTag';
import { useLocation } from '../../../lib/routeUtil';
import { tagGetUrl } from '../../../lib/collections/tags/helpers';
import { Link } from '../../../lib/reactRouterWrapper';

const styles = (theme: ThemeType): JssStyles => ({
  feed: {
    ...theme.typography.body2,
  },
});

const TagHistoryPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { params, query } = useLocation();
  const { slug } = params;
  const focusedUser: string = query.user;
  const { tag, loading: loadingTag } = useTagBySlug(slug, "TagHistoryFragment");
  const { UsersName, SingleColumnSection, MixedTypeFeed, TagRevisionItem, FormatDate, CommentsNode, Loading, LinkToPost, SingleLineFeedEvent } = Components;
  
  if (loadingTag || !tag) {
    return <SingleColumnSection>
      <Loading/>
    </SingleColumnSection>
  }
  
  return <SingleColumnSection>
    <Link to={tagGetUrl(tag)}><h1>{tag.name}</h1></Link>
    <div className={classes.feed}>
    <MixedTypeFeed
      pageSize={50}
      resolverName="TagHistoryFeed"
      resolverArgs={{
        tagId: "String!",
      }}
      resolverArgsValues={{
        tagId: tag._id
      }}
      sortKeyType="Date"
      renderers={{
        tagCreated: {
          fragmentName: "TagHistoryFragment",
          render: (creation: TagHistoryFragment) => <SingleLineFeedEvent>
            Created by <UsersName user={creation.user}/> at <FormatDate date={creation.createdAt}/>
          </SingleLineFeedEvent>,
        },
        tagRevision: {
          fragmentName: "RevisionHistoryEntry",
          render: (revision: RevisionHistoryEntry) => <div>
            <TagRevisionItem
              tag={tag}
              collapsed={!!focusedUser && focusedUser!==revision.user?.slug}
              revision={revision}
              headingStyle={"abridged"}
              documentId={tag._id}
              showDiscussionLink={false}
            />
          </div>,
        },
        // On the version of the tag-history page that's focused on a user, don't show
        // tag applications, only more substantive edits. Motivated by the case of
        // core tags, where tag-applications by moderators are super numerous and would
        // make it impossible to find substantive edits without excessive scrolling.
        ...(focusedUser ? {} : {tagApplied: {
          fragmentName: "TagRelHistoryFragment",
          render: (application: TagRelHistoryFragment) => {
            if (!application.post)
              return null;
            
            return <SingleLineFeedEvent>
              Applied to <LinkToPost post={application.post}/>
              {" by "}
              <UsersName user={application.user}/> at <FormatDate date={application.createdAt}/>
            </SingleLineFeedEvent>
          }
        }}),
        tagDiscussionComment: {
          fragmentName: "CommentsList",
          render: (comment: CommentsList) => <div>
            <CommentsNode
              treeOptions={{ tag }}
              comment={comment}
              loadChildrenSeparately={true}
              forceSingleLine={!!focusedUser}
            />
          </div>
        }
      }}
    />
    </div>
  </SingleColumnSection>
}

const TagHistoryPageComponent = registerComponent("TagHistoryPage", TagHistoryPage, {styles});

declare global {
  interface ComponentTypes {
    TagHistoryPage: typeof TagHistoryPageComponent
  }
}
