import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { tagStyle, smallTagTextStyle, coreTagStyle } from "../tagging/FooterTag";
import { InteractionWrapper } from "../common/useClickableCell";
import { tagGetUrl } from "@/lib/collections/tags/helpers";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    rowGap: "2px",
    flexWrap: "wrap",
    overflow: "hidden",
    maxHeight: 42,
  },
  tag: {
    ...tagStyle(theme),
    ...smallTagTextStyle(theme),
    ...coreTagStyle(theme),
  },
});

export const PeopleDirectoryTopicsCell = ({user, classes}: {
  user: SearchUser,
  classes: ClassesType<typeof styles>,
}) => {
  const {TagsTooltip} = Components;
  return (
    <div className={classes.root}>
      {user.tagNames?.slice(0, 3).map((tagName) => {
        const slug = user.tags?.find(({name}) => name === tagName)?.slug;
        if (!slug) {
          return null;
        }
        return (
          <InteractionWrapper href={tagGetUrl({slug}, {from: "people_directory"})}>
            <TagsTooltip
              tagSlug={slug}
              hideRelatedTags
              key={tagName}
            >
              <div className={classes.tag}>
                {tagName}
              </div>
            </TagsTooltip>
          </InteractionWrapper>
        );
      })}
    </div>
  );
}

const PeopleDirectoryTopicsCellComponent = registerComponent(
  "PeopleDirectoryTopicsCell",
  PeopleDirectoryTopicsCell,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryTopicsCell: typeof PeopleDirectoryTopicsCellComponent
  }
}
