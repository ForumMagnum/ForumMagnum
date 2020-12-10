import React from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useTagBySlug } from '../useTag';
import { useLocation } from '../../../lib/routeUtil';

const styles = (theme: ThemeType): JssStyles => ({
  feed: {
    ...theme.typography.body2,
  },
  singleLineEvent: {
    margin: 8,
  },
});

const TagHistoryPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { params } = useLocation();
  const { slug } = params;
  const { tag, loading: loadingTag } = useTagBySlug(slug, "TagHistoryFragment");
  const { UsersName, SingleColumnSection, MixedTypeFeed, TagRevisionItem, FormatDate, CommentsNode, Loading, LinkToPost } = Components;
  
  if (loadingTag || !tag) {
    return <SingleColumnSection>
      <Loading/>
    </SingleColumnSection>
  }
  
  return <SingleColumnSection>
    <h1>{tag.name}</h1>
    <div className={classes.feed}>
    <MixedTypeFeed
      pageSize={50}
      resolverName="TagHistoryFeed"
      resolverArgs={{
        tagId: "String!",
      }}
      resolverArgsValues={{
        tagId: tag?._id
      }}
      sortKeyType="Date"
      renderers={{
        tagCreated: {
          fragmentName: "TagHistoryFragment",
          render: (creation: TagHistoryFragment) => <div className={classes.singleLineEvent}>
            Created by <UsersName user={creation.user}/> at <FormatDate date={creation.createdAt}/>
          </div>,
        },
        tagRevision: {
          fragmentName: "RevisionHistoryEntry",
          render: (revision: RevisionHistoryEntry) => <div>
            <TagRevisionItem
              tag={tag}
              revision={revision}
              headingStyle={"abridged"}
              documentId={tag._id}
            />
          </div>,
        },
        tagApplied: {
          fragmentName: "TagRelHistoryFragment",
          render: (application: TagRelHistoryFragment) => {
            if (!application.post)
              return null;
            
            return <div className={classes.singleLineEvent}>
              Applied to <LinkToPost post={application.post}/>
              {" by "}
              <UsersName user={application.user}/> at <FormatDate date={application.createdAt}/>
            </div>
          }
        },
        tagDiscussionComment: {
          fragmentName: "CommentsList",
          render: (comment: CommentsList) => <div>
            <CommentsNode
              treeOptions={{}}
              comment={comment}
              loadChildrenSeparately={true}
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
