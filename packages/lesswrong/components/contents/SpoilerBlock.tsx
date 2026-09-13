import React, { useState } from "react";
import classNames from "classnames";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";

const spoilerClassNames = new Set(["spoilers", "spoiler", "spoiler-v2"]);

export const containsSpoilerClassName = (classes: string[]) =>
  classes.some(className => spoilerClassNames.has(className));

export const removeSpoilerClassNames = (classes: string[]) =>
  classes.filter(className => !spoilerClassNames.has(className));

const styles = defineStyles("SpoilerBlock", (theme: ThemeType) => ({
  root: {
    margin: "1em 0",
  },
  inlineRoot: {
    display: "inline",
  },
  toggle: {
    display: "inline-block",
    minHeight: 44,
    padding: "8px 12px",
    border: 0,
    background: theme.palette.panelBackground.spoilerBlock,
    color: theme.palette.text.spoilerBlockNotice,
    cursor: "pointer",
    font: "inherit",
    textAlign: "left",
    "&:focus-visible": {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: -2,
    },
  },
  content: {
    marginTop: 4,
    padding: "0.5em 8px",
    background: theme.palette.panelBackground.revealedSpoilerBlock,
    "& > :first-child": {
      marginTop: "0 !important",
    },
    "& > :last-child": {
      marginBottom: "0 !important",
    },
  },
  inlineContent: {
    marginLeft: 4,
  },
}));

interface SpoilerBlockProps {
  attributes: React.HTMLAttributes<HTMLElement>;
  children: React.ReactNode;
  inline?: boolean;
}

const SpoilerBlock = ({ attributes, children, inline = false }: SpoilerBlockProps) => {
  const classes = useStyles(styles);
  const [revealed, setRevealed] = useState(false);
  const RootTag = inline ? "span" : "div";
  const ContentTag = inline ? "span" : "div";

  return (
    <RootTag
      {...attributes}
      className={classNames(
        attributes.className,
        inline ? classes.inlineRoot : classes.root,
      )}
    >
      <button
        type="button"
        className={classes.toggle}
        aria-expanded={revealed}
        onClick={() => setRevealed(currentlyRevealed => !currentlyRevealed)}
      >
        {revealed ? "Hide spoiler" : "Show spoiler"}
      </button>
      <ContentTag
        className={inline ? classes.inlineContent : classes.content}
        hidden={!revealed}
      >
        {children}
      </ContentTag>
    </RootTag>
  );
};

export default SpoilerBlock;
