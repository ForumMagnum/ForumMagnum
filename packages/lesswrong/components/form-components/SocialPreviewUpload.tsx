import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {Components, getSiteUrl, registerComponent, sanitize } from '../../lib/vulcan-lib';
import { siteImageSetting } from '../vulcan-core/App';
import { htmlToText } from 'html-to-text'
import { truncate } from '../../lib/editor/ellipsize';
import { getPostDescription } from '../posts/PostsPage/PostsPage';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    flexDirection: "row",
  },
  preview: {
    padding: 16,
    marginLeft: 10,
    backgroundColor: theme.palette.grey[100],
    borderRadius: 6,
    width: 'min-content',
  },
  title: {
    fontSize: 14,
    minHeight: 18,
    fontWeight: 700,
    marginTop: 12,
    marginBottom: 7,
  },
  description: {
    fontSize: 12,
    minHeight: 40,
    marginBottom: 7,
  },
  url: {
    fontSize: 12,
    color: theme.palette.grey[600],
  },
  blurb: {
    paddingLeft: 16,
    paddingRight: 16,
    fontSize: 14,
  }
});

// TODO combine
const PLAINTEXT_HTML_TRUNCATION_LENGTH = 4000
const PLAINTEXT_DESCRIPTION_LENGTH = 2000
 
const buildPreviewFromDocument = (document: PostsEditQueryFragment): {description: string | null, fallbackImageUrl: string | null} => {
  const originalContents = document.contents?.originalContents

  if (!originalContents) return {description: null, fallbackImageUrl: null}
  if (originalContents.type !== "html" && originalContents.type !== "ckEditorMarkup") {
    return {
      description: `<Description preview not supported for this editor type (${originalContents.type}), switch to HTML or EA Forum Docs [Beta] to see the description preview>`,
      fallbackImageUrl: null,
    };
  }

  const html = originalContents.data
  if (!html) return {description: null, fallbackImageUrl: null}
  
  const parser = new DOMParser();
  const htmlDoc = parser.parseFromString(html, "text/html");
  // get first img tag
  const img = htmlDoc.querySelector("img");

  const truncatedHtml = truncate(sanitize(html), PLAINTEXT_HTML_TRUNCATION_LENGTH)
  const plaintextDescription = htmlToText(truncatedHtml, {
    wordwrap: false,
    selectors: [
      { selector: "img", format: "skip" },
      { selector: "a", options: { ignoreHref: true } },
    ],
  }).substring(0, PLAINTEXT_DESCRIPTION_LENGTH);
  const previewDesc = getPostDescription({...document, contents: {plaintextDescription}})
  
  return {description: previewDesc, fallbackImageUrl: img?.getAttribute("src") || null}
}

const SocialPreviewUpload = ({name, document, updateCurrentValues, clearField, label, croppingAspectRatio, classes}: {
  name: string,
  document: PostsEditQueryFragment,
  updateCurrentValues: Function,
  clearField: Function,
  label: string,
  croppingAspectRatio?: number,
  classes: ClassesType
}) => {
  const { ImageUpload2 } = Components
  
  const urlHostname = new URL(getSiteUrl()).hostname
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { description, fallbackImageUrl } = useMemo(() => buildPreviewFromDocument(document), [document.contents?.originalContents])

  return (
    <div className={classes.root}>
      <div className={classes.preview}>
        <ImageUpload2
          name={name}
          document={document}
          updateCurrentValues={updateCurrentValues}
          clearField={clearField}
          label={"Preview Image"}
          croppingAspectRatio={croppingAspectRatio}
          // socialPreviewImageUrl falls back to the first image in the post on save
          placeholderUrl={fallbackImageUrl || siteImageSetting.get()}
        />
        <div className={classes.title}>
          {document.title}
        </div>
        <div className={classes.description}>
          {description}
        </div>
        <div className={classes.url}>
          {urlHostname}
        </div>
      </div>
      <div className={classes.blurb}>
        A preview image makes it more likely that people will see your post.
        <br/><br/>
        If you're unsure which image to use, consider trying Unsplash or an AI image generator.
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
