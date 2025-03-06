import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { makeCloudinaryImageUrl } from '../common/CloudinaryImage2';
import { ImageType, useImageUpload } from '../hooks/useImageUpload';
import { formPreviewSizeByImageType } from './ImageUpload';
import { Button } from "@/components/mui-replacement";

const styles = (theme: ThemeType) => ({
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
    display: 'flex',
  },
});


const ImageUpload2 = ({name, value, updateValue, clearField, label, croppingAspectRatio, placeholderUrl, classes}: {
  name: string,
  value: string | null | undefined,
  updateValue: (value: string) => void,
  clearField: Function,
  label: string,
  croppingAspectRatio?: number,
  placeholderUrl?: string,
  classes: ClassesType<typeof styles>
}) => {
  const {uploadImage, ImageUploadScript} = useImageUpload({
    imageType: name as ImageType,
    onUploadSuccess: (publicImageId: string) => {
      setImageId(publicImageId);
      updateValue(publicImageId);
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

  const [imageId, setImageId] = useState(value)
  
  const formPreviewSize = formPreviewSizeByImageType[name as keyof typeof formPreviewSizeByImageType]
  if (!formPreviewSize) throw new Error("Unsupported image upload type")
    
  const imageStyle: React.CSSProperties = {
    aspectRatio: formPreviewSize.width === 'auto' ? '1.91' : `${formPreviewSize.width} / ${formPreviewSize.height}`
  }

  const imageUrl = imageId ? makeCloudinaryImageUrl(imageId, {
    c: "fill",
    dpr: "auto",
    q: "auto",
    f: "auto",
    g: "auto:faces"
  }) : placeholderUrl
  
  if (imageUrl) {
    imageStyle.backgroundImage = `url(${imageUrl})`
  }

  return (
    <div className={classes.root}>
      <ImageUploadScript />
      <div
        className={classes.imageBackground}
        style={imageStyle}
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

const ImageUpload2Component = registerComponent("ImageUpload2", ImageUpload2, {styles});

declare global {
  interface ComponentTypes {
    ImageUpload2: typeof ImageUpload2Component
  }
}

export default ImageUpload2Component;
