import React, { ReactNode } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { isEAForum } from "../../lib/instanceSettings";

const styles = (_theme: ThemeType) => ({
});

const TagsTooltip = ({tag, tagRel, popperCard, children, classes}: {
  tag: TagBasicInfo,
  tagRel?: TagRelMinimumFragment
  popperCard?: ReactNode,
  children: ReactNode,
  classes: ClassesType,
}) => {
  const {LWTooltip, EAHoverOver, TagRelCard} = Components;;
  const popperCardToRender = popperCard ?? (tagRel
    ? <TagRelCard tagRel={tagRel} />
    : <></>
  );
  const Tooltip = isEAForum ? EAHoverOver : LWTooltip;
  return (
    <Tooltip
      title={
        popperCardToRender
      }
      clickable
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
