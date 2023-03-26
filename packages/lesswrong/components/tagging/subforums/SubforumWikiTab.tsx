import classNames from 'classnames';
import React, { useCallback, useState } from 'react';
import { useLocation } from '../../../lib/routeUtil';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { AnalyticsContext, useTracking } from "../../../lib/analyticsEvents";
import { EditTagForm } from '../EditTagPage';
import { useApolloClient } from '@apollo/client/react';
import truncateTagDescription from "../../../lib/utils/truncateTagDescription";
import { forumTypeSetting, taggingNamePluralSetting } from '../../../lib/instanceSettings';
import { truncate } from '../../../lib/editor/ellipsize';
import { tagPostTerms } from '../TagPage';
import { useOnSearchHotkey } from '../../common/withGlobalKeydown';
import { MAX_COLUMN_WIDTH } from '../../posts/PostsPage/PostsPage';
import { tagMinimumKarmaPermissions, tagUserHasSufficientKarma } from '../../../lib/collections/tags/helpers';
import { useCurrentUser } from '../../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  centralColumn: {
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: MAX_COLUMN_WIDTH,
  },
  tagHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
  },
  postsTaggedTitle: {
    color: theme.palette.grey[600]
  },
  pastRevisionNotice: {
    ...theme.typography.commentStyle,
    fontStyle: 'italic'
  },
  wikiSection: {
    paddingTop: 12,
    paddingLeft: 42,
    paddingRight: 42,
    paddingBottom: 12,
    marginBottom: 24,
    background: theme.palette.panelBackground.default,
    borderRadius: theme.borderRadius.default,
  },
})

const isEAForum = forumTypeSetting.get() === 'EAForum'

const SubforumWikiTab = ({tag, revision, truncated, setTruncated, classes}: {
  tag: TagPageFragment | TagPageWithRevisionFragment,
  revision?: string,
  truncated: boolean,
  setTruncated: (truncated: boolean) => void,
  classes: ClassesType,
}) => {
  const {
    PostsListSortDropdown,
    PostsList2,
    ContentItemBody,
    AddPostsToTag,
    UsersNameDisplay,
    TagDiscussionSection,
    TagPageButtonRow,
    TagIntroSequence,
    SectionTitle,
    ContentStyles,
  } = Components;

  const currentUser = useCurrentUser();
  const { query } = useLocation();
  const client = useApolloClient()
  const { captureEvent } =  useTracking()
  const terms = {
    ...tagPostTerms(tag, query),
    limit: 15
  }
  
  const [editing, setEditing] = useState(!!query.edit || !!query.flagId)
  useOnSearchHotkey(() => setTruncated(false));
  
  if (editing && !tagUserHasSufficientKarma(currentUser, "edit")) {
    throw new Error(`Sorry, you cannot edit ${taggingNamePluralSetting.get()} without ${tagMinimumKarmaPermissions.edit} or more karma.`)
  }
  
  const clickReadMore = useCallback(() => {
    setTruncated(false)
    captureEvent("readMoreClicked", {tagId: tag._id, tagName: tag.name, pageSectionContext: "wikiSection"})
  }, [captureEvent, setTruncated, tag._id, tag.name])

  const htmlWithAnchors = tag.tableOfContents?.html ?? tag.description?.html ?? ""
  let description = htmlWithAnchors;
  // EA Forum wants to truncate much less than LW
  if(isEAForum) {
    description = truncated ? truncateTagDescription(htmlWithAnchors) : htmlWithAnchors;
  } else {
    description = (truncated && !tag.wikiOnly)
      ? truncate(htmlWithAnchors, tag.descriptionTruncationCount || 4, "paragraphs", "<span>...<p><a>(Read More)</a></p></span>")
      : htmlWithAnchors
  }

  return <>
      <div className={classNames(classes.wikiSection, classes.centralColumn)}>
        <TagPageButtonRow tag={tag} editing={editing} setEditing={setEditing} />
        <AnalyticsContext pageSectionContext="wikiSection">
          {revision && tag.description && (tag.description as TagRevisionFragment_description).user && (
            <div className={classes.pastRevisionNotice}>
              You are viewing revision {tag.description.version}, last edited by{" "}
              <UsersNameDisplay user={(tag.description as TagRevisionFragment_description).user} />
            </div>
          )}
          {editing ? (
            <EditTagForm
              tag={tag}
              successCallback={async () => {
                setEditing(false);
                await client.resetStore();
              }}
              cancelCallback={() => setEditing(false)}
            />
          ) : (
            <div onClick={clickReadMore}>
              <ContentStyles contentType="tag">
                <ContentItemBody
                  dangerouslySetInnerHTML={{ __html: description || "" }}
                  description={`tag ${tag.name}`}
                />
              </ContentStyles>
            </div>
          )}
        </AnalyticsContext>
      </div>
      <div className={classes.centralColumn}>
        {editing && <TagDiscussionSection key={tag._id} tag={tag} />}
        {tag.sequence && <TagIntroSequence tag={tag} />}
        {!tag.wikiOnly && (
          <AnalyticsContext pageSectionContext="tagsSection">
            {tag.sequence ? (
              <SectionTitle title={`Posts tagged ${tag.name}`} noBottomPadding>
                <PostsListSortDropdown value={query.sortedBy || "relevance"} />
              </SectionTitle>
            ) : (
              <div className={classes.tagHeader}>
                <div className={classes.postsTaggedTitle}>
                  Posts tagged <em>{tag.name}</em>
                </div>
                <PostsListSortDropdown value={query.sortedBy || "relevance"} />
              </div>
            )}
            <PostsList2 terms={terms} enableTotal tagId={tag._id} itemsPerPage={200}>
              <AddPostsToTag tag={tag} />
            </PostsList2>
          </AnalyticsContext>
        )}
      </div>
    </>
}

const SubforumWikiTabComponent = registerComponent(
  'SubforumWikiTab', SubforumWikiTab, {styles}
);

declare global {
  interface ComponentTypes {
    SubforumWikiTab: typeof SubforumWikiTabComponent
  }
}
