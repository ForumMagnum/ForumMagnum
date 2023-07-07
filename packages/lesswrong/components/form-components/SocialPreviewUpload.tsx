import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {Components, getSiteUrl, registerComponent, sanitize } from '../../lib/vulcan-lib';
import { siteImageSetting } from '../vulcan-core/App';
import { htmlToText } from 'html-to-text'
import { truncate } from '../../lib/editor/ellipsize';
import { getPostDescription } from '../posts/PostsPage/PostsPage';
import { PLAINTEXT_DESCRIPTION_LENGTH, PLAINTEXT_HTML_TRUNCATION_LENGTH } from '../../lib/collections/revisions/collection';
import markdownIt from 'markdown-it'
import markdownItContainer from 'markdown-it-container'
import markdownItFootnote from 'markdown-it-footnote'
import markdownItSub from 'markdown-it-sub'
import markdownItSup from 'markdown-it-sup'
import { randomId } from '../../lib/random';
import { ckEditorName } from '../editor/Editor';
import classNames from 'classnames';
import Input from '@material-ui/core/Input';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "grid",
    gridTemplateColumns: "minmax(201px, 1fr) minmax(170px, 269px)",

    [theme.breakpoints.down('xs')]: {
      display: "flex",
      flexDirection: "column",
    }
  },
  preview: {
    padding: 16,
    marginLeft: 10,
    marginRight: 10,
    backgroundColor: theme.palette.grey[100],
    borderRadius: 6,

    [theme.breakpoints.down('xs')]: {
      marginBottom: 16,
    }
  },
  title: {
    fontSize: 14,
    minHeight: 18,
    fontWeight: 700,
    marginTop: 12,
    marginBottom: 7,
    overflowWrap: "anywhere",
  },
  descriptionWrapper: {
    height: 36,
    marginBottom: 5,
  },
  description: {
    fontSize: 12,
    overflowWrap: "anywhere",
    whiteSpace: "pre-line",
    paddingTop: 0,
    paddingBottom: 2,
    maxHeight: 36,
    alignItems: "baseline",
    width: "100%",
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    overflow: "auto"
  },
  url: {
    fontSize: 12,
    color: theme.palette.grey[600],
  },
  blurb: {
    marginLeft: 6,
    marginRight: 16,
    fontSize: 14,
    lineHeight: '20px',
    '& a': {
      color: theme.palette.primary.main,
    },

    [theme.breakpoints.down('xs')]: {
      marginLeft: 16,
    }
  }
});

// Derived from PostsEditQueryFragment, but with extra data that can be set locally (only dataWithDiscardedSuggestions)
interface PostsEditWithLocalData extends PostsEdit { // fragment on Posts
  readonly contents: RevisionEdit & { dataWithDiscardedSuggestions: string | null} | null,
}

const mdi = markdownIt({linkify: true})
// mdi.use(markdownItMathjax()) // for performance, don't render mathjax
mdi.use(markdownItContainer, 'spoiler')
mdi.use(markdownItFootnote)
mdi.use(markdownItSub)
mdi.use(markdownItSup)

// TODO to make preview text editable:
// - [X] use highlight text as the social preview text
// - [X] make sure this is patched through to this component (probably in the same way as the main contents)
// - make the field clickable to edit, set the highlight text if they type a character
// - other styling changes
// ...stretch
// - also include a button to clear the highlight text and revert to the default
// - also warn them if they're making it too long

// there is a problem in that customHighlight is a full ckeditor field, but the social preview can only
// really support plain text. I think adding another field is the way to go

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
const buildPreviewFromDocument = (document: PostsEditWithLocalData): {description: string | null, fallbackImageUrl: string | null} => {
  const originalContents = document.contents?.originalContents;
  const customHighlight = document.customHighlight?.originalContents;

  const toPlainText = (content: string, type: string) => {
    if (!content) return null;
    const html = type === 'markdown' ? mdi.render(content, {docId: randomId()}) : content;
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
      ]
    }).substring(0, PLAINTEXT_DESCRIPTION_LENGTH);
  };

  const processContents = (contents: {type: string, data: string}) => {
    if (!['html', 'ckEditorMarkup', 'markdown'].includes(contents.type)) {
      return {
        description: `<Description preview not supported for this editor type (${contents.type}), switch to HTML, Markdown, or ${ckEditorName} to see the description preview>`,
        image: null
      };
    }
    const data = document.contents?.dataWithDiscardedSuggestions ?? contents.data;
    const html = contents.type === 'markdown' ? mdi.render(data, {docId: randomId()}) : data;
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(html, "text/html");
    const img = htmlDoc.querySelector("img");
    const plaintextDescription = toPlainText(html, contents.type);
    return {
      description: plaintextDescription,
      image: img?.getAttribute("src")
    };
  };

  const originalContentProcessed = originalContents ? processContents(originalContents) : {description: null, image: null};
  const highlightPlaintextDesc = customHighlight ? toPlainText(customHighlight.data, customHighlight.type) : null;

  const previewDesc = getPostDescription({
    ...document,
    contents: {plaintextDescription: originalContentProcessed.description},
    customHighlight: {plaintextDescription: highlightPlaintextDesc}
  });

  return {
    description: previewDesc,
    fallbackImageUrl: originalContentProcessed.image ?? null
  }
}



// TODO move to own file?
const SocialPreviewTextEdit = ({name, value, updateCurrentValues, classes}: {
  name: string,
  value: string,
  updateCurrentValues: UpdateCurrentValues,
  classes: ClassesType
}) => {
  return (
    <div className={classes.descriptionWrapper}>
      <Input
        className={classes.description}
        placeholder={"Write a preview subtitle..."}
        value={value}
        onChange={(event) => {
          console.log("updateCurrentValues", { name, oldValue: value, value: event.target.value });
          void updateCurrentValues({
            [name]: event.target.value,
          });
        }}
        disableUnderline={true}
        multiline
      />
    </div>
  );
}

const SocialPreviewUpload = ({name, document, updateCurrentValues, clearField, label, croppingAspectRatio, classes}: {
  name: string,
  document: PostsEditWithLocalData,
  updateCurrentValues: UpdateCurrentValues,
  clearField: Function,
  label: string,
  croppingAspectRatio: number,
  classes: ClassesType
}) => {
  const { ImageUpload2 } = Components
  
  const urlHostname = new URL(getSiteUrl()).hostname
  const { description, fallbackImageUrl } = useMemo(
    () => buildPreviewFromDocument(document),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      document.contents?.originalContents,
      document.contents?.dataWithDiscardedSuggestions,
      document.customHighlight?.originalContents,
      document.socialPreviewText,
    ]
  );

  console.log("SocialPreviewUpload", {socialPreviewText: document.socialPreviewText})

  const hasTitle = document.title && document.title.length > 0
  const hasDescription = description && description.length > 0

  return (
    <div className={classes.root}>
      <div className={classes.preview}>
        <ImageUpload2
          name={name}
          document={document}
          updateCurrentValues={updateCurrentValues}
          clearField={clearField}
          label={fallbackImageUrl ? "Change Preview Image" : "Upload Preview Image"}
          croppingAspectRatio={croppingAspectRatio}
          // socialPreviewImageUrl falls back to the first image in the post on save
          placeholderUrl={fallbackImageUrl || siteImageSetting.get()}
        />
        <div className={classNames(classes.title, {[classes.placeholder]: !hasTitle})}>
          {document.title || "Title"}
        </div>
        <SocialPreviewTextEdit
          name={"socialPreviewText"}
          value={description ?? ""}
          updateCurrentValues={updateCurrentValues}
          classes={classes}
        />
        <div className={classes.url}>
          {urlHostname}
        </div>
      </div>
      <div className={classes.blurb}>
        A preview image makes it more likely that people will see your post.
        <br/><br/>
        If you're unsure which image to use, consider trying <a target="_blank" rel="noreferrer" href="https://unsplash.com/">Unsplash</a> or an AI image generator.
      </div>
    </div>
  );
};

(SocialPreviewUpload as any).contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
};

const SocialPreviewUploadComponent = registerComponent("SocialPreviewUpload", SocialPreviewUpload, {styles});

declare global {
  interface ComponentTypes {
    SocialPreviewUpload: typeof SocialPreviewUploadComponent
  }
}
