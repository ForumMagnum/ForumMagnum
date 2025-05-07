
import React from "react";
import { Components } from "../../lib/vulcan-lib/components";
import { tagStyle, smallTagTextStyle, coreTagStyle } from "../tagging/FooterTag";
import { InteractionWrapper } from "../common/useClickableCell";
import { tagGetUrl } from "@/lib/collections/tags/helpers";
import {
  EMPTY_TEXT_PLACEHOLDER,
  emptyTextCellStyles,
  textCellStyles,
} from "./PeopleDirectoryTextCell";
import { defineStyles, useStyles } from "../hooks/useStyles";

const styles = defineStyles('PeopleDirectoryTopicsCell', (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    rowGap: "2px",
    flexWrap: "wrap",
    overflow: "hidden",
    height: 42,
  },
  noTags: {
    ...emptyTextCellStyles(theme),
  },
  tag: {
    ...tagStyle(theme),
    ...smallTagTextStyle(theme),
    ...coreTagStyle(theme),
  },
  more: {
    ...textCellStyles(theme),
    color: theme.palette.grey[600],
    marginTop: 2,
    marginLeft: 6,
  },
  tooltip: {
    background: theme.palette.grey[50],
    borderRadius: theme.borderRadius.default,
    padding: 16,
  },
  tooltipTags: {
    display: "flex",
    gap: "4px",
    flexWrap: "wrap",
    maxWidth: "calc(min(100vw, 300px))",
  },
}));

const TAG_COUNT = 2;

const TagDisplay = ({name, slug}: {
  name: string,
  slug: string,
  className?: string,
}) => {
  const classes = useStyles(styles);
  const {TagsTooltip} = Components;
  return (
    <InteractionWrapper
      key={slug}
      href={tagGetUrl({slug}, {from: "people_directory"})}
      openInNewTab
    >
      <TagsTooltip tagSlug={slug} hideRelatedTags>
        <div className={classes.tag}>
          {name}
        </div>
      </TagsTooltip>
    </InteractionWrapper>
  );
}

export const PeopleDirectoryTopicsCell = ({user}: {
  user: SearchUser,
}) => {
  const classes = useStyles(styles);
  const {LWTooltip} = Components;
  return (
    <div className={classes.root}>
      {(user.tags?.length ?? 0) === 0 &&
        <div className={classes.noTags}>
          {EMPTY_TEXT_PLACEHOLDER}
        </div>
      }
      {user.tags?.slice(0, TAG_COUNT).map(({name, slug}) => (
        <TagDisplay key={slug} name={name} slug={slug} />
      ))}
      {(user.tags?.length ?? 0) > TAG_COUNT &&
        <div className={classes.more}>
          <LWTooltip
            title={
              <div className={classes.tooltipTags}>
                {user.tags!.slice(TAG_COUNT).map(({name, slug}) => (
                  <TagDisplay
                    key={slug}
                    name={name}
                    slug={slug}
                  />
                ))}
              </div>
            }
            titleClassName={classes.tooltip}
            tooltip={false}
            clickable
          >
            + {user.tags!.length - TAG_COUNT} more
          </LWTooltip>
        </div>
      }
    </div>
  );
}
