import React from 'react';
import PropTypes from 'prop-types';
import {Components, registerComponent } from '../../lib/vulcan-lib';
import { siteImageSetting } from '../vulcan-core/App';
import { getPostDescription } from '../posts/PostsPage/PostsPage';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    flexDirection: "row",
  },
  preview: {
    padding: 16,
    marginLeft: 20,
    backgroundColor: theme.palette.grey[100],
    borderRadius: 6,
    width: 'min-content',
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    marginTop: 12,
    marginBottom: 7,
  },
  description: {
    fontSize: 12,
  },
  blurb: {
    paddingLeft: 16,
    paddingRight: 16,
    fontSize: 14,
  }
});

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
  
  console.log(document)
  
  const description = getPostDescription(document)

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
          placeholderUrl={document.socialPreviewImageUrl || siteImageSetting.get()}
        />
        <div className={classes.title}>
          {document.title}
        </div>
        {description && <div className={classes.description}>
          {description}
        </div>}
        
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
