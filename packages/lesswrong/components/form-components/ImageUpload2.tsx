/* global cloudinary */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../lib/vulcan-lib';
import { Helmet } from 'react-helmet';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import { useTheme } from '../themes/useTheme';
import { cloudinaryUploadPresetSocialPreviewSetting } from './ImageUpload';
import { makeCloudinaryImageUrl } from '../common/CloudinaryImage2';

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

const cloudinaryArgsByImageType: AnyBecauseTodo = {
  socialPreviewImageId: {
    minImageHeight: 400,
    minImageWidth: 700,
    croppingAspectRatio: 1.91,
    croppingDefaultSelectionRatio: 1,
    uploadPreset: cloudinaryUploadPresetSocialPreviewSetting.get(),
  },
}

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
  const theme = useTheme();

  const setImageInfo = (error: AnyBecauseTodo, result: AnyBecauseTodo) => {
    if (error) {
      throw new Error(error.statusText)
    }
    // currently we ignore all events other than a successful upload -
    // see list here: https://cloudinary.com/documentation/upload_widget_reference#events
    if (result.event !== 'success') {
      return
    }
    const imageInfo = result.info
    if (imageInfo && imageInfo.public_id) {
      setImageId(imageInfo.public_id)
      updateCurrentValues({[name]: imageInfo.public_id})
    } else {
      //eslint-disable-next-line no-console
      console.error("Image Upload failed");
    }
  }

  const uploadWidget = () => {
    const cloudinaryArgs = cloudinaryArgsByImageType[name]
    if (!cloudinaryArgs) throw new Error("Unsupported image upload type")
    // @ts-ignore
    cloudinary.openUploadWidget({
      multiple: false,
      sources: ['local', 'url', 'camera', 'facebook', 'instagram', 'google_drive'],
      cropping: true,
      cloudName: cloudinaryCloudNameSetting.get(),
      theme: 'minimal',
      croppingValidateDimensions: true,
      croppingShowDimensions: true,
      styles: {
        palette: {
            tabIcon: theme.palette.primary.main,
            link: theme.palette.primary.main,
            action: theme.palette.primary.main,
            textDark: "#212121",
        },
        fonts: {
            default: null,
            "'Merriweather', serif": {
                url: "https://fonts.googleapis.com/css?family=Merriweather",
                active: true
            }
        }
      },
      ...cloudinaryArgs,
      ...(croppingAspectRatio ? {croppingAspectRatio} : {})
    }, setImageInfo);
  }
  
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
      <Helmet>
        <script src="https://upload-widget.cloudinary.com/global/all.js" type="text/javascript" />
      </Helmet>
      <div className={classes.imageBackground} style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : {}}>
        <div className={classes.buttonRow}>
          <Button onClick={uploadWidget} className={classNames("image-upload-button", classes.button)}>
            {imageId ? `Change` : label }
          </Button>
          {imageId && <Button className={classes.button} title="Remove" onClick={removeImg}>
            Remove
          </Button>}
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
