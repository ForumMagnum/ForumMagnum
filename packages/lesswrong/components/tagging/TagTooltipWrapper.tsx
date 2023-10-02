import React, { ReactNode } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useHover } from "../common/withHover";

const TagTooltipWrapper = ({tag, tagRel, popperCard, As = "div", children}: {
  tag: TagPreviewFragment | TagSectionPreviewFragment | TagRecentDiscussion,
  tagRel?: TagRelMinimumFragment,
  popperCard?: ReactNode,
  As?: keyof JSX.IntrinsicElements,
  children: ReactNode,
}) => {
  const {hover, anchorEl, eventHandlers} = useHover({
    pageElementContext: "tagItem",
    tagId: tag._id,
    tagName: tag.name,
    tagSlug: tag.slug
  });

  const {PopperCard, TagRelCard, TagPreview} = Components;
  const popperCardToRender = popperCard ?? (tagRel
    ? <TagRelCard tagRel={tagRel} />
    : <TagPreview tag={tag} postCount={tag.postCount} />
  );

  return (
    <As {...eventHandlers}>
      {children}
      <PopperCard open={hover} anchorEl={anchorEl} allowOverflow>
        <div>
          {popperCardToRender}
        </div>
      </PopperCard>
    </As>
  );
}

const TagTooltipWrapperComponent = registerComponent(
  "TagTooltipWrapper",
  TagTooltipWrapper,
);

declare global {
  interface ComponentTypes {
    TagTooltipWrapper: typeof TagTooltipWrapperComponent
  }
}
