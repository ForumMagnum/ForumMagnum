import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {Components, registerComponent } from '../../lib/vulcan-lib';
import Button from '@material-ui/core/Button';
import ImageIcon from '@material-ui/icons/Image';
import classNames from 'classnames';
import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser';
import { userHasDefaultProfilePhotos } from '../../lib/betas';
import { ImageType, useImageUpload } from '../hooks/useImageUpload';
import { isEAForum } from '../../lib/instanceSettings';

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

const formPreviewSizeByImageType: Record<
  ImageType,
  {width: number | "auto", height: number}
> = {
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
    width: 320,
    height: 180
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
  const currentUser = useCurrentUser();
  const {uploadImage, ImageUploadScript} = useImageUpload({
    imageType: name as ImageType,
    onUploadSuccess: (publicImageId: string) => {
      setImageId(publicImageId);
      void updateCurrentValues({[name]: publicImageId});
    },
    onUploadError: (error: Error) => {
      // eslint-disable-next-line no-console
      console.error("Image Upload failed:", error);
    },
    croppingAspectRatio,
  });

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

  const showUserProfileImage = isEAForum && name === "profileImageId";

  const {UsersProfileImage, CloudinaryImage2} = Components;
  return (
    <div className={classes.root}>
      <ImageUploadScript />
      {showUserProfileImage &&
        <UsersProfileImage
          user={document}
          size={formPreviewSize.height}
        />
      }
      {imageId && !showUserProfileImage &&
        <CloudinaryImage2
          publicId={imageId}
          {...formPreviewSize}
        /> }
      <Button
        onClick={uploadImage}
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
      {userHasDefaultProfilePhotos(currentUser) && name === 'profileImageId' &&
        <Button
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
        </Button>
      }
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
