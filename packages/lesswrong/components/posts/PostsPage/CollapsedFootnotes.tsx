import React, { useState, useRef, useEffect } from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { useLocation } from "../../../lib/routeUtil";
import { useOnSearchHotkey } from "../../common/withGlobalKeydown";
import { InteractionWrapper } from "../../common/useClickableCell";
import Collapse from "@/lib/vendor/@material-ui/core/src/Collapse";
import classNames from "classnames";

const TRANSITION_DURATION = 200;

export const EXPAND_FOOTNOTES_EVENT = "expand-footnotes";

export const locationHashIsFootnote = (hash: string) =>
  hash.startsWith("#fn") && !hash.startsWith("#fnref");
export const locationHashIsFootnoteBackreference = (hash: string) =>
  hash.startsWith("#fnref");

const styles = (theme: ThemeType) => ({
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
});

const htmlToElement = <T extends HTMLElement>(html: string): T | null => {
  const div = document.createElement("div");
  div.innerHTML = html.trim();
  return div.firstChild as T | null;
}

const extractChildren = <T extends HTMLElement>(
  elem: T,
  selector: string,
): string => {
  const children = Array.from(elem.querySelectorAll(selector));
  return children.map((child) => child.outerHTML).join(" ");
}

// Because this component is only created client-side by ContentItemBody, this
// doesn't need to be (and definitely isn't) SSR-safe.
const splitFootnotes = (html: string, previewCount: number) => {
  const elem = htmlToElement<HTMLDivElement>(html);
  return elem
    ? {
      preview: extractChildren(elem, `li:nth-child(-n + ${previewCount})[id]`),
      rest: extractChildren(elem, `li:nth-child(n + ${previewCount + 1})[id]`),
      totalCount: elem.querySelectorAll("li").length,
    }
    : {preview: "", rest: "", totalCount: 0};
}

const CollapsedFootnotesInner = ({
  footnotesHtml,
  attributes,
  previewCount = 3,
  classes,
}: {
  footnotesHtml: string,
  attributes?: Record<string, unknown>,
  previewCount?: number,
  classes: ClassesType<typeof styles>,
}) => {
  const {hash} = useLocation();
  const [collapsed, setCollapsed] = useState(!locationHashIsFootnote(hash ?? ""));
  const [fullyExpanded, setFullyExpanded] = useState(!collapsed);
  const ref = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const handler = (e: CustomEvent<string>) => {
      setCollapsed(false);
      setTimeout(() => {
        document.querySelector(e.detail)?.scrollIntoView();
      }, fullyExpanded ? 0 : TRANSITION_DURATION);
    };
    window.addEventListener(EXPAND_FOOTNOTES_EVENT, handler);
    return () => window.removeEventListener(EXPAND_FOOTNOTES_EVENT, handler);
  }, [fullyExpanded]);

  useOnSearchHotkey(() => setCollapsed(false));

  const {preview, rest, totalCount} = splitFootnotes(footnotesHtml, previewCount);

  if (totalCount <= previewCount) {
    return (
      <ol {...attributes} dangerouslySetInnerHTML={{__html: footnotesHtml}} />
    );
  }

  return (
    <div {...attributes}>
      <ol dangerouslySetInnerHTML={{__html: preview}} />
      <Collapse
        in={!collapsed}
        onEntered={() => setFullyExpanded(true)}
        timeout={TRANSITION_DURATION}
        className={classNames(
          classes.collapse,
          {[classes.fullyExpanded]: fullyExpanded},
        )}
      >
        <ol
          ref={ref}
          dangerouslySetInnerHTML={{__html: rest}}
          start={previewCount + 1}
        />
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

export const CollapsedFootnotes = registerComponent(
  "CollapsedFootnotes",
  CollapsedFootnotesInner,
  {styles},
);


