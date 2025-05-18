import React, { useRef, useState } from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import Collapse from "@/lib/vendor/@material-ui/core/src/Collapse";
import { InteractionWrapper } from '../common/useClickableCell';
import { useLocation } from "@/lib/routeUtil";
import classNames from 'classnames';

const styles = defineStyles("CollapsedFootnotes2", (theme: ThemeType) => ({
  collapse: {
    marginTop: "-1.5em",
  },
  fullyExpanded: {
    overflow: "visible",
  },
  buttonWrapper: {
    marginTop: "1em",
  },
  button: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 600,
    color: theme.palette.primary.main,
    cursor: "pointer",
    "&:hover": {
      color: theme.palette.primary.dark,
    },
  },
}));

const TRANSITION_DURATION = 200;
export const EXPAND_FOOTNOTES_EVENT = "expand-footnotes";

export const locationHashIsFootnote = (hash: string) =>
  hash.startsWith("#fn") && !hash.startsWith("#fnref");
export const locationHashIsFootnoteBackreference = (hash: string) =>
  hash.startsWith("#fnref");

export function CollapsedFootnotes2({ previewCount=3, attributes, footnoteElements }: {
  previewCount?: number,
  attributes: Record<string, unknown>,
  footnoteElements: React.ReactNode[],
}) {
  const {hash} = useLocation();
  const [collapsed, setCollapsed] = useState(!locationHashIsFootnote(hash ?? ""));
  const [fullyExpanded, setFullyExpanded] = useState(!collapsed);
  const ref = useRef<HTMLOListElement>(null);
  const classes = useStyles(styles);

  const preview = footnoteElements.slice(0, previewCount);
  const rest = footnoteElements.slice(previewCount);

  return (
    <div {...attributes}>
      {preview}
      <Collapse
        in={!collapsed}
        onEntered={() => setFullyExpanded(true)}
        timeout={TRANSITION_DURATION}
        className={classNames({
          [classes.collapse]: collapsed,
          [classes.fullyExpanded]: fullyExpanded,
        })}
      >
        {rest}
      </Collapse>
      <Collapse in={collapsed} className={classes.buttonWrapper}>
        <InteractionWrapper>
          <span
            className={classes.button}
            onClick={() => setCollapsed(false)}
          >
            Show all footnotes
          </span>
        </InteractionWrapper>
      </Collapse>
    </div>
  );
}
