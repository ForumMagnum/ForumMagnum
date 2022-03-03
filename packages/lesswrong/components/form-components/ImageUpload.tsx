/* global cloudinary */
import React, { Component, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {Components, registerComponent } from '../../lib/vulcan-lib';
import { Helmet } from 'react-helmet';
import Button from '@material-ui/core/Button';
import ImageIcon from '@material-ui/icons/Image';
import classNames from 'classnames';
import { cloudinaryCloudNameSetting, DatabasePublicSetting } from '../../lib/publicSettings';
import forumThemeExport from '../../themes/forumTheme';
import { useDialog } from '../common/withDialog';

const cloudinaryUploadPresetGridImageSetting = new DatabasePublicSetting<string>('cloudinary.uploadPresetGridImage', 'tz0mgw2s')
const cloudinaryUploadPresetBannerSetting = new DatabasePublicSetting<string>('cloudinary.uploadPresetBanner', 'navcjwf7')
const cloudinaryUploadPresetSocialPreviewSetting = new DatabasePublicSetting<string | null>('cloudinary.uploadPresetSocialPreview', null)
const cloudinaryUploadPresetEventImageSetting = new DatabasePublicSetting<string | null>('cloudinary.uploadPresetEventImage', null)

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    "& img": {
      display: "block",
      marginBottom: 8,
    },
  },
  button: {
    background: "rgba(0,0,0, 0.5)",
    "&:hover": {
      background: "rgba(0,0,0,.35)"
    },
    color: "white",
  },
  imageIcon: {
    fontSize: 18,
    marginRight: theme.spacing.unit
  },
  chooseButton: {
    marginLeft: 10
  },
  removeButton: {
    color: "rgba(0,0,0, 0.5)",
    marginLeft: 10
  }
});

const cloudinaryArgsByImageType = {
  gridImageId: {
    minImageHeight: 80,
    minImageWidth: 203,
    croppingAspectRatio: 2.5375,
    uploadPreset: cloudinaryUploadPresetGridImageSetting.get(),
  },
  bannerImageId: {
    minImageHeight: 300,
    minImageWidth: 700,
    croppingAspectRatio: 1.91,
    croppingDefaultSelectionRatio: 1,
    uploadPreset: cloudinaryUploadPresetBannerSetting.get(),
  },
  socialPreviewImageId: {
    minImageHeight: 400,
    minImageWidth: 700,
    croppingAspectRatio: 1.91,
    croppingDefaultSelectionRatio: 1,
    uploadPreset: cloudinaryUploadPresetSocialPreviewSetting.get(),
  },
  eventImageId: {
    minImageHeight: 270,
    minImageWidth: 480,
    cropping: false,
    uploadPreset: cloudinaryUploadPresetEventImageSetting.get()
  }
}

const formPreviewSizeByImageType = {
  gridImageId: {
    width: 203,
    height: 80
  },
  bannerImageId: {
    width: "auto",
    height: 380
  },
  socialPreviewImageId: {
    width: 153,
    height: 80
  },
  eventImageId: {
    width: 320,
    height: 180
  }
}

const ImageUpload = ({name, document, updateCurrentValues, clearField, label, classes}: {
  name: string,
  document: Object,
  updateCurrentValues: Function,
  clearField: Function,
  label: string,
  classes: ClassesType
}) => {

  const setImageInfo = (error, result) => {
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
            tabIcon: forumThemeExport.palette.primary.main,
            link: forumThemeExport.palette.primary.main,
            action: forumThemeExport.palette.primary.main,
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
      ...cloudinaryArgs
    }, setImageInfo);
  }
  
  const chooseDefaultImg = (newImageId) => {
    setImageId(newImageId)
    updateCurrentValues({[name]: newImageId})
  }
  
  const removeImg = () => {
    clearField()
    setImageId(null)
  }
  
  const { openDialog } = useDialog()
  const [imageId, setImageId] = useState(() => {
    if (document && document[name]) {
      return document[name];
    }
    return ''
  })
  
  const formPreviewSize = formPreviewSizeByImageType[name]
  if (!formPreviewSize) throw new Error("Unsupported image upload type")
  
  return (
    <div className={classes.root}>
      <Helmet>
        <script src="https://upload-widget.cloudinary.com/global/all.js" type="text/javascript"/>
      </Helmet>
      {imageId &&
        <Components.CloudinaryImage
          publicId={imageId}
          {...formPreviewSize}
        /> }
      <Button
        onClick={uploadWidget}
        className={classNames("image-upload-button", classes.button)}
      >
        <ImageIcon className={classes.imageIcon}/>
        {imageId ? `Replace ${label}` : `Upload ${label}`}
      </Button>
      {(name === 'eventImageId') && <Button
        variant="outlined"
        onClick={() => openDialog({
          componentName: "ImageUploadDefaultsDialog",
          componentProps: {onSelect: chooseDefaultImg}
        })}
        className={classes.chooseButton}
      >
        Choose from ours
      </Button>}
      {imageId && <Button
        className={classes.removeButton}
        title="Remove"
        onClick={removeImg}
      >
        Remove
      </Button>}
    </div>
  );
};

(ImageUpload as any).contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
};

const ImageUploadComponent = registerComponent("ImageUpload", ImageUpload, {styles});

declare global {
  interface ComponentTypes {
    ImageUpload: typeof ImageUploadComponent
  }
}
