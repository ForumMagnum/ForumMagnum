import React, { ReactNode } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { isEAForum } from "../../lib/instanceSettings";

const styles = (_theme: ThemeType) => ({
});

const TagsTooltip = ({
  tag,
  tagRel,
  popperCard,
  As,
  inlineBlock=false,
  children,
  classes,
}: {
  tag: TagPreviewFragment | TagSectionPreviewFragment | TagRecentDiscussion,
  tagRel?: TagRelMinimumFragment
  popperCard?: ReactNode,
  As?: keyof JSX.IntrinsicElements,
  inlineBlock?: boolean,
  children: ReactNode,
  classes: ClassesType,
}) => {
  const {LWTooltip, EAHoverOver, TagRelCard, TagPreview} = Components;
  const Tooltip = isEAForum ? EAHoverOver : LWTooltip;
  return (
    <Tooltip
      title={
        popperCard ?? (tagRel
          ? <TagRelCard tagRel={tagRel} />
          : <TagPreview tag={tag} postCount={tag.postCount} />
        )
      }
      clickable
      As={As}
      inlineBlock={inlineBlock}
      analyticsProps={{
        pageElementContext: "tagItem",
        tagId: tag._id,
        tagName: tag.name,
        tagSlug: tag.slug
      }}
    >
      {children}
    </Tooltip>
  );
}

const TagsTooltipComponent = registerComponent(
  "TagsTooltip",
  TagsTooltip,
  {styles},
);

declare global {
  interface ComponentTypes {
    TagsTooltip: typeof TagsTooltipComponent
  }
}
