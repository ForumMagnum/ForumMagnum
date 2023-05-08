/* global cloudinary */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {Components, registerComponent } from '../../lib/vulcan-lib';
import { Helmet } from 'react-helmet';
import Button from '@material-ui/core/Button';
import ImageIcon from '@material-ui/icons/Image';
import classNames from 'classnames';
import { cloudinaryCloudNameSetting, DatabasePublicSetting } from '../../lib/publicSettings';
import { useTheme } from '../themes/useTheme';
import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser';
import { userHasDefaultProfilePhotos } from '../../lib/betas';

export const cloudinaryUploadPresetGridImageSetting = new DatabasePublicSetting<string>('cloudinary.uploadPresetGridImage', 'tz0mgw2s')
export const cloudinaryUploadPresetBannerSetting = new DatabasePublicSetting<string>('cloudinary.uploadPresetBanner', 'navcjwf7')
export const cloudinaryUploadPresetProfileSetting = new DatabasePublicSetting<string | null>('cloudinary.uploadPresetProfile', null)
export const cloudinaryUploadPresetSocialPreviewSetting = new DatabasePublicSetting<string | null>('cloudinary.uploadPresetSocialPreview', null)
export const cloudinaryUploadPresetEventImageSetting = new DatabasePublicSetting<string | null>('cloudinary.uploadPresetEventImage', null)
export const cloudinaryUploadPresetSpotlightSetting = new DatabasePublicSetting<string | null>('cloudinary.uploadPresetSpotlight', 'yjgxmsio')

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    paddingTop: 4,
    marginLeft: 8,
    "& img": {
      display: "block",
      marginBottom: 8,
    },
  },
  button: {
    background: theme.palette.buttons.imageUpload.background,
    "&:hover": {
      background: theme.palette.buttons.imageUpload.hoverBackground,
    },
    color: theme.palette.text.invertedBackgroundText,
  },
  imageIcon: {
    fontSize: 18,
    marginRight: theme.spacing.unit
  },
  chooseButton: {
    marginLeft: 10
  },
  removeButton: {
    color: theme.palette.icon.dim,
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
    croppingAspectRatio: 4.7,
    croppingDefaultSelectionRatio: 1,
    uploadPreset: cloudinaryUploadPresetBannerSetting.get(),
  },
  squareImageId: {
    minImageHeight: 300,
    minImageWidth: 300,
    croppingAspectRatio: 1,
    croppingDefaultSelectionRatio: 1,
    // Reuse the banner upload preset, since they are basically different versions of the same image
    uploadPreset: cloudinaryUploadPresetBannerSetting.get(),
  },
  profileImageId: {
    minImageHeight: 170,
    minImageWidth: 170,
    croppingAspectRatio: 1,
    croppingDefaultSelectionRatio: 1,
    uploadPreset: cloudinaryUploadPresetProfileSetting.get(),
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
    minImageWidth: 500,
    croppingAspectRatio: 1.91,
    croppingDefaultSelectionRatio: 1.91,
    uploadPreset: cloudinaryUploadPresetEventImageSetting.get()
  },
  spotlightImageId: {
    minImageHeight: 232,
    minImageWidth: 345,
    cropping: false,
    uploadPreset: cloudinaryUploadPresetSpotlightSetting.get()
  },
  spotlightDarkImageId: {
    minImageHeight: 232,
    minImageWidth: 345,
    cropping: false,
    uploadPreset: cloudinaryUploadPresetSpotlightSetting.get()
  },
}

const formPreviewSizeByImageType = {
  gridImageId: {
    width: 203,
    height: 80
  },
  bannerImageId: {
    width: "auto",
    height: 280
  },
  squareImageId: {
    width: 90,
    height: 90
  },
  profileImageId: {
    width: 90,
    height: 90
  },
  socialPreviewImageId: {
    width: 153,
    height: 80
  },
  eventImageId: {
    width: 373,
    height: 195
  },
  spotlightImageId: {
    width: 345,
    height: 234
  },
  spotlightDarkImageId: {
    width: 345,
    height: 234
  },
}

const ImageUpload = ({name, document, updateCurrentValues, clearField, label, croppingAspectRatio, classes}: FormComponentProps<string> & {
  clearField: Function,
  croppingAspectRatio?: number,
  classes: ClassesType
}) => {
  const theme = useTheme();

  const setImageInfo = (error: any, result: any) => {
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
      void updateCurrentValues({[name]: imageInfo.public_id})
    } else {
      //eslint-disable-next-line no-console
      console.error("Image Upload failed");
    }
  }

  const uploadWidget = () => {
    const cloudinaryArgs = cloudinaryArgsByImageType[name as keyof typeof cloudinaryArgsByImageType]
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
  
  const chooseDefaultImg = (newImageId: string) => {
    setImageId(newImageId)
    void updateCurrentValues({[name]: newImageId})
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
  
  const formPreviewSize = formPreviewSizeByImageType[name as keyof typeof formPreviewSizeByImageType]
  if (!formPreviewSize) throw new Error("Unsupported image upload type")
  
  return (
    <div className={classes.root}>
      <Helmet>
        <script src="https://upload-widget.cloudinary.com/global/all.js" type="text/javascript"/>
      </Helmet>
      {imageId &&
        <Components.CloudinaryImage2
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
      {userHasDefaultProfilePhotos(useCurrentUser()) && (name === 'profileImageId') && <Button
        variant="outlined"
        onClick={() => openDialog({
          componentName: "ImageUploadDefaultsDialog",
          componentProps: {
            onSelect: chooseDefaultImg,
            type: "Profile"}
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
