import React, { FC, useState } from 'react';
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
import { useSingle } from '../../lib/crud/withSingle';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    paddingTop: 4,
    marginLeft: 8,
    display: "flex",
    flexWrap: "wrap",
  },
  img: {
    flexBasis: "100%",
    marginBottom: 10,
  },
  button: {
    background: theme.palette.buttons.imageUpload.background,
    "&:hover": {
      background: theme.palette.buttons.imageUpload.hoverBackground,
    },
    color: theme.palette.text.invertedBackgroundText,
  },
  profileImageButton: {
    margin: "10px 0",
    fontSize: 14,
    fontWeight: 500,
    textTransform: "none",
    background: theme.palette.primary.main,
    color: "#fff", // Dark mode independent
    "&:hover": {
      background: theme.palette.primary.light,
    },
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
  },
  removeProfileImageButton: {
    textTransform: "none",
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.primary.main,
    margin: "10px 0 10px 20px",
    padding: 0,
    "&:hover": {
      color: theme.palette.primary.dark,
      background: "transparent",
    },
  },
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

const FormProfileImage: FC<{
  document: Partial<UsersMinimumInfo>,
  profileImageId: string,
  size: number,
}> = ({document, profileImageId, size}) => {
  const {document: user} = useSingle({
    collectionName: "Users",
    fragmentName: "UsersMinimumInfo",
    fetchPolicy: "cache-and-network",
    documentId: document._id,
  });
  return (
    <Components.UsersProfileImage
      user={user ? {...user, profileImageId} : undefined}
      size={size}
    />
  );
}

const TriggerButton: FC<{
  imageType: ImageType,
  imageId?: string,
  uploadImage: () => void,
  label?: string,
  classes: ClassesType,
}> = ({imageType, imageId, uploadImage, label, classes}) => {
  let mainClass = classes.button;
  let showIcon = true;
  if (isEAForum && imageType === "profileImageId") {
    label = "profile image";
    mainClass = classes.profileImageButton;
    showIcon = false;
  }
  return (
    <Button
      onClick={uploadImage}
      className={classNames("image-upload-button", mainClass)}
    >
      {showIcon && <ImageIcon className={classes.imageIcon} />}
      {imageId ? `Replace ${label}` : `Upload ${label}`}
    </Button>
  );
}

const RemoveButton: FC<{
  imageType: ImageType,
  imageId?: string,
  removeImage: () => void,
  classes: ClassesType,
}> = ({imageType, imageId, removeImage, classes}) => {
  if (!imageId) {
    return null;
  }
  const mainClass = isEAForum && imageType === "profileImageId"
    ? classes.removeProfileImageButton
    : classes.removeButton;
  return (
    <Button
      title="Remove"
      onClick={removeImage}
      className={mainClass}
    >
      Remove
    </Button>
  );
}

const ImageUpload = ({name, document, updateCurrentValues, clearField, label, croppingAspectRatio, classes}: FormComponentProps<string> & {
  clearField: Function,
  croppingAspectRatio?: number,
  classes: ClassesType
}) => {
  const imageType = name as ImageType;
  const currentUser = useCurrentUser();
  const {uploadImage, ImageUploadScript} = useImageUpload({
    imageType: imageType,
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

  return (
    <div className={classes.root}>
      <ImageUploadScript />
      <div className={classes.img}>
        {showUserProfileImage &&
          <FormProfileImage
            document={document}
            profileImageId={imageId}
            size={formPreviewSize.height}
          />
        }
        {imageId && !showUserProfileImage &&
          <Components.CloudinaryImage2
            publicId={imageId}
            {...formPreviewSize}
          />
        }
      </div>
      <TriggerButton
        imageType={imageType}
        imageId={imageId}
        uploadImage={uploadImage}
        label={label}
        classes={classes}
      />
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
        </Button>
      }
      <RemoveButton
        imageType={imageType}
        imageId={imageId}
        removeImage={removeImg}
        classes={classes}
      />
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
