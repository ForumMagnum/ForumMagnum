import classNames from "classnames";
import take from "lodash/take";
import React, { useCallback, useState } from "react";
import { useUpdate } from "../../../lib/crud/withUpdate";
import { taggingNameSetting } from "../../../lib/instanceSettings";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { useCurrentUser } from "../../common/withUser";
import type { TagsTooltipPreviewWrapper } from "../TagsTooltip";
import { stableSortTags } from "../../../lib/collections/tags/helpers";
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";
import ContentStyles from "../../common/ContentStyles";
import FooterTag from "../FooterTag";
import AddTagButton from "../AddTagButton";
import Loading from "../../vulcan-core/Loading";

const TagSubtagFragmentQuery = gql(`
  query SidebarSubtagsBox($documentId: String) {
    tag(input: { selector: { documentId: $documentId } }) {
      result {
        ...TagSubtagFragment
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {
    padding: "1em 1.5em",
    borderRadius: theme.borderRadius.default,
  },
  previewWrapperRow: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    ...theme.typography.smallText,
    marginRight: 16,
    padding: 10,
    color: theme.palette.grey[600],
  },
  removeButton: {
    float: "right",
  },
  showAllSubtags: {
    margin: "5px 0 0",
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.lwTertiary.main,
  },
});

const SidebarSubtagsBox = ({ tag, className, classes }: {
  tag: TagPageFragment | TagPageWithRevisionFragment,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const [isAwaiting, setIsAwaiting] = useState(false)
  const [showAllSubtags, setShowAllSubtags] = useState(false)
  const currentUser = useCurrentUser();

  // TODO: we fetch the tag twice (once in TagSubforumPage2 and once here) because we want to get more info about the subtags, which could slow down the main page if there are a lot of them.
  // Change it so TagSubforumPage2 doesn't fetch the subtags at all. Not doing this right now because it's unclear whether TagPage and TagSubforumPage2 will be merged together.
  const { refetch, data } = useQuery(TagSubtagFragmentQuery, {
    variables: { documentId: tag._id },
  });
  const tagWithSubtags = data?.tag?.result;

  const { mutate: updateTag } = useUpdate({
    collectionName: "Tags",
    fragmentName: "TagBasicInfo",
  });

  const setParentTag = useCallback(async ({ subTagId, parentTagId }: {
    subTagId: string,
    parentTagId: string | null,
  }) => {
    setIsAwaiting(true)
    await updateTag({ selector: { _id: subTagId }, data: { parentTagId } });
    await refetch();
    setIsAwaiting(false)
  }, [updateTag, refetch]);

  // TODO: open this up to subforum moderators at least. The reason we can't do this at the moment is that subtags can only have one parent,
  // so we don't want people stealing subtags from other subforums.
  const canEditSubtags = !!(currentUser?.isAdmin || currentUser?.groups?.includes("sunshineRegiment"));

  const PreviewWrapper = useCallback<TagsTooltipPreviewWrapper>(({
    tag: subTag,
    loading,
    children,
  }) => {
    if (!subTag || loading) {
      return <>{children}</>;
    }
    return (
      <>
        {canEditSubtags &&
          <div className={classes.previewWrapperRow}>
            <a
              onClick={() => setParentTag({
                subTagId: subTag._id,
                parentTagId: null,
              })}
              className={classes.removeButton}
            >
              Remove {taggingNameSetting.get()}
            </a>
          </div>
        }
        {children}
      </>
    );
  }, [canEditSubtags, classes, setParentTag]);

  if (!tagWithSubtags) {
    return null;
  }

  const subTags = tagWithSubtags.subTags;

  // still show the box if the user can edit subtags, to expose the add button
  if (!canEditSubtags && (!subTags || !subTags.length)) {
    return null;
  }

  const sortedSubtags = stableSortTags(subTags.map((subTag) => ({
    tag: subTag,
    tagRel: null,
  }))).map(({ tag }) => tag);
  const visibleSubtags = showAllSubtags ? sortedSubtags : take(sortedSubtags, 7)

  return (
    <div className={classNames(className, classes.root)}>
      <ContentStyles contentType="tag">
        <h2>Posts in this space are about</h2>
      </ContentStyles>
      <span>
        <FooterTag
          key={tag._id}
          tag={tag}
          hoverable={true}
          hideScore={true}
          hideRelatedTags
          PreviewWrapper={PreviewWrapper}
        />
        {visibleSubtags.map((tag) => (
          <FooterTag
            key={tag._id}
            tag={tag}
            hoverable={true}
            hideScore={true}
            PreviewWrapper={PreviewWrapper}
          />
        ))}
        {canEditSubtags && <AddTagButton onTagSelected={({ tagId: subTagId }) => setParentTag({ subTagId, parentTagId: tag._id })} />}
        {!showAllSubtags && visibleSubtags.length < sortedSubtags.length && <div className={classes.showAllSubtags}><a onClick={() => setShowAllSubtags(true)}>Show All</a></div>}
        { isAwaiting && <Loading/>}
      </span>
    </div>
  );
};

export default registerComponent("SidebarSubtagsBox", SidebarSubtagsBox, { styles });


