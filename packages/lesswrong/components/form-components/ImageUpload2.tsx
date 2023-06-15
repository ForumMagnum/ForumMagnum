import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../lib/vulcan-lib';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { makeCloudinaryImageUrl } from '../common/CloudinaryImage2';
import { ImageType, useImageUpload } from '../hooks/useImageUpload';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    "& img": {
      display: "block",
      marginBottom: 8,
    },
  },
  buttonRow: {
    margin: 'auto',
  },
  button: {
    background: theme.palette.buttons.imageUpload2.background,
    "&:hover": {
      background: theme.palette.buttons.imageUpload2.hoverBackground,
    },
    color: theme.palette.text.alwaysWhite, // text is always against a dark background, even in dark mode
    textTransform: 'none',
    margin: 5,
    fontSize: 14,
    paddingTop: 10,
    paddingBottom: 10,
  },
  imageBackground: {
    backgroundColor: theme.palette.grey[25], // fallback to plain background if no image is given
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    aspectRatio: 1.91, // TODO support other image types
    display: 'flex',
  },
});

const formPreviewSizeByImageType: AnyBecauseTodo = {
  socialPreviewImageId: {
    width: 306,
    height: 160
  },
}

const ImageUpload2 = ({name, document, updateCurrentValues, clearField, label, croppingAspectRatio, placeholderUrl, classes}: {
  name: string,
  document: AnyBecauseTodo,
  updateCurrentValues: Function,
  clearField: Function,
  label: string,
  croppingAspectRatio?: number,
  placeholderUrl?: string,
  classes: ClassesType
}) => {
  const {uploadImage, ImageUploadScript} = useImageUpload({
    imageType: name as ImageType,
    onUploadSuccess: (publicImageId: string) => {
      setImageId(publicImageId);
      updateCurrentValues({[name]: publicImageId});
    },
    onUploadError: (error: Error) => {
      // eslint-disable-next-line no-console
      console.error("Image Upload failed:", error);
    },
    croppingAspectRatio,
  });

  const removeImg = () => {
    clearField()
    setImageId(null)
  }

  const [imageId, setImageId] = useState(() => {
    if (document && document[name]) {
      return document[name];
    }
    return ''
  })

  const formPreviewSize = formPreviewSizeByImageType[name]
  if (!formPreviewSize) throw new Error("Unsupported image upload type")

  const imageUrl = imageId ? makeCloudinaryImageUrl(imageId, {
    c: "fill",
    dpr: "auto",
    q: "auto",
    f: "auto",
    g: "auto:faces"
  }) : placeholderUrl

  return (
    <div className={classes.root}>
      <ImageUploadScript />
      <div
        className={classes.imageBackground}
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : {}}
      >
        <div className={classes.buttonRow}>
          <Button
            onClick={uploadImage}
            className={classNames("image-upload-button", classes.button)}
          >
            {imageId ? `Change` : label }
          </Button>
          {imageId &&
            <Button className={classes.button} title="Remove" onClick={removeImg}>
              Remove
            </Button>
          }
        </div>
      </div>
    </div>
  );
};

(ImageUpload2 as any).contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
};

const ImageUpload2Component = registerComponent("ImageUpload2", ImageUpload2, {styles});

declare global {
  interface ComponentTypes {
    ImageUpload2: typeof ImageUpload2Component
  }
}
