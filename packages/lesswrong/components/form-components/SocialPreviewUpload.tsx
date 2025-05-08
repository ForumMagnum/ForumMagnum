import React, { useCallback, useEffect, useMemo, useState } from "react";
import { siteImageSetting } from '@/lib/publicSettings';
import { htmlToText } from "html-to-text";
import { truncate } from "../../lib/editor/ellipsize";
import { getPostDescription } from "../posts/PostsPage/PostsPage";
import {
  PLAINTEXT_DESCRIPTION_LENGTH,
  PLAINTEXT_HTML_TRUNCATION_LENGTH
} from '@/lib/collections/revisions/revisionConstants';
import markdownIt from "markdown-it";
import markdownItContainer from "markdown-it-container";
import markdownItFootnote from "markdown-it-footnote";
import markdownItSub from "markdown-it-sub";
import markdownItSup from "markdown-it-sup";
import { randomId } from "../../lib/random";
import { ckEditorName } from "../editor/Editor";
import Input from "@/lib/vendor/@material-ui/core/src/Input";
import { getSiteUrl, sanitize } from "../../lib/vulcan-lib/utils";
import type { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';
import type { EditablePost } from '../../lib/collections/posts/helpers';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { ImageUpload2 } from "./ImageUpload2";

const DESCRIPTION_HEIGHT = 56; // 3 lines

const styles = defineStyles('SocialPreviewUpload', (theme: ThemeType) => ({
  root: {
    display: "grid",
    gridTemplateColumns: "minmax(201px, 1fr) minmax(170px, 269px)",

    [theme.breakpoints.down("xs")]: {
      display: "flex",
      flexDirection: "column",
    },
  },
  preview: {
    padding: 16,
    marginLeft: 10,
    marginRight: 10,
    backgroundColor: theme.palette.grey[100],
    borderRadius: 6,

    [theme.breakpoints.down("xs")]: {
      marginBottom: 16,
    },
  },
  title: {
    fontSize: 16,
    minHeight: 18,
    fontWeight: 700,
    marginTop: 12,
    marginBottom: 7,
    overflowWrap: "anywhere",
  },
  descriptionWrapper: {
    minHeight: DESCRIPTION_HEIGHT,
    marginBottom: 5,
  },
  description: {
    fontSize: 13,
    fontWeight: 500,
    overflowWrap: "anywhere",
    whiteSpace: "pre-line",
    paddingTop: 0,
    paddingBottom: 2,
    // Allow around 1 line of expansion before scrolling
    maxHeight: DESCRIPTION_HEIGHT + 16,
    alignItems: "baseline",
    width: "100%",
    borderBottom: `1px solid ${theme.palette.grey[400]}`,
    overflow: "auto",
  },
  bottomRow: {
    fontSize: 13,
    fontWeight: 500,
    color: theme.palette.grey[600],
    display: "flex",
    justifyContent: "space-between",
  },
  revertButton: {
    fontWeight: 600,
    fontStyle: "italic",
    "&:hover": {
      cursor: "pointer",
    },
  },
  blurb: {
    marginLeft: 6,
    marginRight: 16,
    marginBottom: 28,
    fontSize: 14,
    lineHeight: "20px",
    fontWeight: 500,
    "& a": {
      color: theme.palette.primary.main,
    },
    [theme.breakpoints.down("xs")]: {
      marginLeft: 16,
      marginBottom: 0,
    },
    // display children at top and bottom of container
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  note: {
    color: theme.palette.grey[600],

    [theme.breakpoints.down("xs")]: {
      display: "none",
    },
  },
}));

// FIXME This is a copy-paste of a markdown config from conversionUtils that has gotten out of sync
const mdi = markdownIt({ linkify: true });
// mdi.use(markdownItMathjax()) // for performance, don't render mathjax
mdi.use(markdownItContainer as AnyBecauseHard, "spoiler");
mdi.use(markdownItFootnote);
mdi.use(markdownItSub);
mdi.use(markdownItSup);

/**
 * Build the preview description and extract the first image in the document to use as a fallback. This is duplicating
 * the fairly roundabout process that happens on the server to generate the preview description and image. The logic here
 * is _almost_ exactly the same, but skips some overly complicated or potentially slow steps, namely:
 * - trimming whitespace
 * - rendering LaTex
 * - handling markdown and DraftJS (seeing as these are no longer supported for non admins)
 *
 * The complete process:
 * 1. The document is saved on the server (on submit or "save as draft")
 *  1.1. originalContents is converted to html using dataToHtml, this handles LaTeX and trimming whitespace also (packages/lesswrong/server/editor/make_editable_callbacks.ts)
 *  1.2. socialPreviewImageAutoUrl is set to the first image in the document (packages/lesswrong/server/callbacks/postCallbacks.ts)
 * 2. The document is loaded
 *  2.1. plaintextDescription is resolved from the html (packages/lesswrong/server/resolvers/revisionResolvers.ts)
 *  2.2. socialPreviewImageUrl is resolved from the combination of socialPreviewImageId (the image that is (maybe) set explicitly) and socialPreviewAutoUrl (packages/lesswrong/lib/collections/posts/schema.tsx)
 * 3. The head tags are set in PostsPage (packages/lesswrong/components/posts/PostsPage/PostsPage.tsx)
 *  3.1 plaintextDescription is truncated
 *  3.2 socialPreviewImageUrl is just used directly
 */
const buildPreviewFromDocument = (
  document: EditablePost, socialText: string | undefined
): { description: string | null; fallbackImageUrl: string | null } => {
  const originalContents = document.contents?.originalContents;
  const customHighlight = document.customHighlight?.originalContents;

  const toPlainText = (content: string, type: string) => {
    if (!content) return null;
    const html = type === "markdown" ? mdi.render(content, { docId: randomId() }) : content;
    const truncatedHtml = truncate(sanitize(html), PLAINTEXT_HTML_TRUNCATION_LENGTH);
    return htmlToText(truncatedHtml, {
      wordwrap: false,
      selectors: [
        { selector: "img", format: "skip" },
        { selector: "a", options: { ignoreHref: true } },
        { selector: "p", options: { leadingLineBreaks: 1 } },
        { selector: "h1", options: { trailingLineBreaks: 1 } },
        { selector: "h2", options: { trailingLineBreaks: 1 } },
        { selector: "h3", options: { trailingLineBreaks: 1 } },
      ],
    }).substring(0, PLAINTEXT_DESCRIPTION_LENGTH);
  };

  const processContents = (contents: { type: string; data: string }) => {
    if (!["html", "ckEditorMarkup", "markdown"].includes(contents.type)) {
      return {
        description: `<Description preview not supported for this editor type (${contents.type}), switch to HTML, Markdown, or ${ckEditorName} to see the description preview>`,
        image: null,
      };
    }
    const data = document.contents?.dataWithDiscardedSuggestions ?? contents.data;
    const html = contents.type === "markdown" ? mdi.render(data, { docId: randomId() }) : data;
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(html, "text/html");
    const img = htmlDoc.querySelector("img");
    const plaintextDescription = toPlainText(html, contents.type);
    return {
      description: plaintextDescription,
      image: img?.getAttribute("src"),
    };
  };

  const originalContentProcessed = originalContents
    ? processContents(originalContents)
    : { description: null, image: null };
  const highlightPlaintextDesc = customHighlight ? toPlainText(customHighlight.data, customHighlight.type) : null;

  const previewDesc =
    socialText !== undefined
      ? socialText
      : getPostDescription({
          ...document,
          contents: { plaintextDescription: originalContentProcessed.description },
          customHighlight: { plaintextDescription: highlightPlaintextDesc },
        });

  return {
    description: previewDesc,
    fallbackImageUrl: originalContentProcessed.image ?? null,
  };
};

const SocialPreviewTextEdit = ({
  value,
  updateValue,
}: {
  value: string;
  updateValue: (value: string) => void;
}) => {
  const classes = useStyles(styles);

  // This handling here is a workaround for a bug in the Input component, you can ignore it
  // and just assume `value` is the source of truth here
  //
  // Details of the bug: The Input component manages its own size with some javascript which sets
  // its height explicitly. When you type one character at a time this is fine, but when a large
  // block of text is pasted in it fails to expand the height enough (I think it only does one line
  // per update) and a scroll is introduced. This workaround makes it so large updates are incrementally
  // added when the length reaches the danger zone of introducing a scroll.
  const INCREMENT = 10;
  const MAX_SAFE_LENGTH = 100;
  const getNewLength = (currentLength: number) => Math.max(currentLength + INCREMENT, MAX_SAFE_LENGTH);

  const [displayedValue, setDisplayedValue] = useState(value);

  useEffect(() => {
    if (displayedValue !== value) {
      setDisplayedValue(value.slice(0, getNewLength(displayedValue.length)));
    }
  }, [value, displayedValue]);

  return (
    <div className={classes.descriptionWrapper}>
      <Input
        className={classes.description}
        placeholder={"Write a preview subtitle..."}
        value={displayedValue}
        onChange={(event) => {
          setDisplayedValue(event.target.value.slice(0, getNewLength(value.length)));
          updateValue(event.target.value);
        }}
        disableUnderline={true}
        multiline
      />
    </div>
  );
};

interface SocialPreviewUploadProps {
  field: TypedFieldApi<SocialPreviewType>;
  post: EditablePost;
  croppingAspectRatio?: number;
}

export const SocialPreviewUpload = ({
  field,
  post,
  croppingAspectRatio,
}: SocialPreviewUploadProps) => {
  const classes = useStyles(styles);
  const value = field.state.value;

  const docWithValue = { ...post, socialPreviewData: value };

  const textValue = value?.text ?? undefined;

  const urlHostname = new URL(getSiteUrl()).hostname;
  const { description, fallbackImageUrl } = useMemo(
    () => buildPreviewFromDocument(docWithValue, textValue),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      docWithValue.contents?.originalContents,
      docWithValue.contents?.dataWithDiscardedSuggestions,
      docWithValue.customHighlight?.originalContents,
      textValue,
    ]
  );

  const updateImageId = useCallback((imageId?: string) => {
    field.handleChange({ ...value, imageId });
  }, [field, value]);

  const updateText = useCallback((text?: string) => {
    field.handleChange({ ...value, text });
  }, [field, value]);

  return (
    <div className={classes.root}>
      <div className={classes.preview}>
        <ImageUpload2
          name={"socialPreviewImageId"}
          value={post.socialPreviewData?.imageId}
          updateValue={updateImageId}
          clearField={() => updateImageId(undefined)}
          label={fallbackImageUrl ? "Change preview image" : "Upload preview image"}
          croppingAspectRatio={croppingAspectRatio}
          // socialPreviewImageUrl falls back to the first image in the post on save
          placeholderUrl={fallbackImageUrl || siteImageSetting.get()}
        />
        <div className={classes.title}>
          {post.title || "Title"}
        </div>
        <SocialPreviewTextEdit value={description ?? ""} updateValue={updateText} />
        <div className={classes.bottomRow}>
          <div>{urlHostname}</div>
          {textValue !== undefined && (
            <div className={classes.revertButton} onClick={() => updateText(undefined)}>
              use default text
            </div>
          )}
        </div>
      </div>
      <div className={classes.blurb}>
        <div>
          A preview image makes it more likely that people will see your post. Consider using{" "}
          <a target="_blank" rel="noreferrer" href="https://unsplash.com/">
            Unsplash
          </a>{" "}
          or an AI image generator.
        </div>
        <div className={classes.note}>
          <strong>Note:</strong> Text changes here will not affect the post.
        </div>
      </div>
    </div>
  );
};
