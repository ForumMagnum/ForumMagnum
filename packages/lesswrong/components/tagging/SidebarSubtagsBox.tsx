import classNames from "classnames";
import React, { useState } from "react";
import { useSingle } from "../../lib/crud/withSingle";
import { useUpdate } from "../../lib/crud/withUpdate";
import { taggingNameSetting } from "../../lib/instanceSettings";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { useCurrentUser } from "../common/withUser";
import { sortTags } from "./FooterTagList";
import { TagPreviewProps } from "./TagPreview";

const styles = (theme: ThemeType): JssStyles => ({
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
});

const SidebarSubtagsBox = ({ tagId, className, classes }: { tagId; className?: string; classes: ClassesType }) => {
  const { ContentStyles, FooterTag, AddTagButton, TagPreview, Loading } = Components;

  const [isAwaiting, setIsAwaiting] = useState(false)
  const currentUser = useCurrentUser();

  // TODO: we fetch the tag twice (once in TagSubforumPage2 and once here) because we want to get more info about the subtags, which could slow down the main page if there are a lot of them.
  // Change it so TagSubforumPage2 doesn't fetch the subtags at all. Not doing this right now because it's unclear whether TagPage and TagSubforumPage2 will be merged together.
  const {
    document: tagWithSubtags,
    refetch,
  } = useSingle({
    documentId: tagId,
    collectionName: "Tags",
    fragmentName: "TagSubtagFragment",
  });

  const { mutate: updateTag } = useUpdate({
    collectionName: "Tags",
    fragmentName: "TagBasicInfo",
  });

  const setParentTag = async ({ subTagId, parentTagId }: { subTagId: string; parentTagId: string | null }) => {
    setIsAwaiting(true)
    await updateTag({ selector: { _id: subTagId }, data: { parentTagId } });
    await refetch();
    setIsAwaiting(false)
  };

  if (!tagWithSubtags) return null;

  // TODO: open this up to subforum moderators at least. The reason we can't do this at the moment is that subtags can only have one parent,
  // so we don't want people stealing subtags from other subforums.
  const canEditSubtags = !!(currentUser?.isAdmin || currentUser?.groups?.includes("sunshineRegiment"));
  const subTags = tagWithSubtags?.subTags;

  // still show the box if the user can edit subtags, to expose the add button
  if (!canEditSubtags && (!subTags || !subTags.length)) return null;

  const WrappedTagPreview = ({ tag: subTag, ...otherProps }: Omit<TagPreviewProps, "classes">) => {
    if (!subTag) return null;

    return (
      <>
        {canEditSubtags && <div className={classes.previewWrapperRow}>
          <a className={classes.removeButton} onClick={() => setParentTag({ subTagId: subTag._id, parentTagId: null })}>
            Remove {taggingNameSetting.get()}
          </a>
        </div>}
        <TagPreview tag={subTag} {...otherProps} />
      </>
    );
  };

  return (
    <div className={className}>
      <ContentStyles contentType="tag">
        <h2>Posts in this space are about</h2>
      </ContentStyles>
      <span className={classes.root}>
        {sortTags(subTags, (t) => t).map((tag) => (
          <FooterTag
            key={tag._id}
            tag={tag}
            hideScore={true}
            popperCard={<WrappedTagPreview tag={tag} showRelatedTags={false} />}
          />
        ))}
        {canEditSubtags && <AddTagButton onTagSelected={({ tagId: subTagId }) => setParentTag({ subTagId, parentTagId: tagId })} />}
        { isAwaiting && <Loading/>}
      </span>
    </div>
  );
};

const SidebarSubtagsBoxComponent = registerComponent("SidebarSubtagsBox", SidebarSubtagsBox, { styles });

declare global {
  interface ComponentTypes {
    SidebarSubtagsBox: typeof SidebarSubtagsBoxComponent;
  }
}
