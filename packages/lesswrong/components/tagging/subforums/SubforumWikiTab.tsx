import classNames from 'classnames';
import React, { useCallback, useState } from 'react';
import { useLocation } from '../../../lib/routeUtil';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { AnalyticsContext, useTracking } from "../../../lib/analyticsEvents";
import { EditTagForm } from '../EditTagPage';
import { useApolloClient } from '@apollo/client/react';
import truncateTagDescription from "../../../lib/utils/truncateTagDescription";
import { taggingNamePluralSetting } from '../../../lib/instanceSettings';
import { truncate } from '../../../lib/editor/ellipsize';
import { RelevanceLabel, tagPageHeaderStyles, tagPostTerms } from '../TagPageUtils';
import { useOnSearchHotkey } from '../../common/withGlobalKeydown';
import { MAX_COLUMN_WIDTH } from '@/components/posts/PostsPage/constants';
import { tagMinimumKarmaPermissions, tagUserHasSufficientKarma } from '../../../lib/collections/tags/helpers';
import { useCurrentUser } from '../../common/withUser';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { useSingle } from '@/lib/crud/withSingle';
import PostsListSortDropdown from "../../posts/PostsListSortDropdown";
import PostsList2 from "../../posts/PostsList2";
import { ContentItemBody } from "../../contents/ContentItemBody";
import AddPostsToTag from "../AddPostsToTag";
import UsersNameDisplay from "../../users/UsersNameDisplay";
import TagDiscussionSection from "../TagDiscussionSection";
import TagPageButtonRow from "../TagPageButtonRow";
import TagIntroSequence from "../TagIntroSequence";
import SectionTitle from "../../common/SectionTitle";
import ContentStyles from "../../common/ContentStyles";
import Loading from "../../vulcan-core/Loading";

const styles = (theme: ThemeType) => ({
  centralColumn: {
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: MAX_COLUMN_WIDTH,
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
  ...tagPageHeaderStyles(theme),
});

const SubforumWikiTab = ({tag, revision, truncated, setTruncated, classes}: {
  tag: TagPageFragment | TagPageWithRevisionFragment,
  revision?: string,
  truncated: boolean,
  setTruncated: (truncated: boolean) => void,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const { query } = useLocation();
  const client = useApolloClient()
  const { captureEvent } =  useTracking()
  const [editing, setEditing] = useState(!!query.edit || !!query.flagId)

  const { document: editableTag } = useSingle({
    documentId: tag._id,
    collectionName: 'Tags',
    fragmentName: 'TagEditFragment',
    skip: !editing,
  });

  const terms = {
    ...tagPostTerms(tag, query),
    limit: 15
  }
  
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
  if(isFriendlyUI) {
    description = truncated
      ? truncateTagDescription(htmlWithAnchors, tag.descriptionTruncationCount)
      : htmlWithAnchors;
  } else {
    description = (truncated && !tag.wikiOnly)
      ? truncate(htmlWithAnchors, tag.descriptionTruncationCount || 4, "paragraphs", "<span>...<p><a>(Read More)</a></p></span>")
      : htmlWithAnchors
  }

  const editTagForm = editableTag
    ? <EditTagForm
      tag={editableTag}
      successCallback={() => setEditing(false)}
      cancelCallback={() => setEditing(false)}
    />
    : <Loading />;

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
          {editing
            ? editTagForm
            : (
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
            <SectionTitle title={`Posts tagged ${tag.name}`} />
            <div className={classes.postListMeta}>
              <PostsListSortDropdown value={query.sortedBy || "top"} />
              <div className={classes.relevance}>
                <RelevanceLabel />
              </div>
            </div>
            <PostsList2 terms={terms} enableTotal tagId={tag._id} itemsPerPage={200}>
              <AddPostsToTag tag={tag} />
            </PostsList2>
          </AnalyticsContext>
        )}
      </div>
    </>
}

export default registerComponent(
  'SubforumWikiTab', SubforumWikiTab, {styles}
);


