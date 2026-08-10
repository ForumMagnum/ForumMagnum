import React, { FC } from 'react';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import ImageIcon from '@/lib/vendor/@material-ui/icons/src/Image';
import classNames from 'classnames';
import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser';
import { userHasDefaultProfilePhotos } from '../../lib/betas';
import { ImageType, useImageUpload } from '../hooks/useImageUpload';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';
import CloudinaryImage2 from "../common/CloudinaryImage2";
import ImageUploadDefaultsDialog from "./ImageUploadDefaultsDialog";

const styles = defineStyles('ImageUpload', (theme: ThemeType) => ({
  root: {
    paddingTop: 4,
    marginLeft: 8,
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "10px",
  },
  imgVertical: {
    flexBasis: "100%",
  },
  buttons: {
    display: "flex",
  },
  buttonsHorizontal: {
    gap: "10px",
    height: 56,
  },
  buttonsVertical: {
    flexDirection: "column",
    marginLeft: 10,
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
    color: theme.palette.text.alwaysWhite, // Dark mode independent
    "&:hover": {
      background: theme.palette.primary.light,
    },
  },
  profileImageButtonVertical: {
    marginBottom: 4,
  },
  imageIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  removeButton: {
    color: theme.palette.icon.dim,
  },
}));

export const formPreviewSizeByImageType: Record<
  ImageType,
  { width: number | "auto"; height: number; imgProps?: any }
> = {
  gridImageId: { width: 250, height: 100 },
  bannerImageId: { width: 1600, height: 380, imgProps: { g: 'custom', dpr: '2.0' } },
  squareImageId: { width: 90, height: 90 },
  profileImageId: { width: 90, height: 90 },
  socialPreviewImageId: { width: 153, height: 80 },
  eventImageId: { width: 373, height: 195 },
  spotlightImageId: { width: 345, height: 234 },
  spotlightDarkImageId: { width: 345, height: 234 },
  onsiteDigestImageId: { width: 200, height: 300 },
}

const TriggerButton: FC<{
  imageType: ImageType,
  imageId?: string,
  uploadImage: () => void,
  label?: string,
  horizontal?: boolean,
}> = ({imageType, imageId, uploadImage, label, horizontal}) => {
  const classes = useStyles(styles);
  let mainClass = classes.button;
  let showIcon = true;
  return (
    <Button
      onClick={uploadImage}
      className={classNames(
        "image-upload-button",
        mainClass,
        horizontal && classes.profileImageButtonVertical,
      )}
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
}> = ({imageType, imageId, removeImage}) => {
  const classes = useStyles(styles);
  if (!imageId) {
    return null;
  }

  return (
    <Button
      title="Remove"
      onClick={removeImage}
      className={classNames("image-remove-button", classes.removeButton)}
    >
      Remove
    </Button>
  );
}

interface ImageUploadProps {
  field: TypedFieldApi<string | null | undefined>;
  label?: string;
  croppingAspectRatio?: number;
  horizontal?: boolean;
}


export const ImageUpload = ({
  field,
  label,
  croppingAspectRatio,
  horizontal = false,
}: ImageUploadProps) => {
  const classes = useStyles(styles);
  const imageType = field.name as ImageType;
  const currentUser = useCurrentUser();
  const {uploadImage} = useImageUpload({
    imageType,
    onUploadSuccess: (publicImageId: string) => {
      field.handleChange(publicImageId);
    },
    onUploadError: (error: Error) => {
      // eslint-disable-next-line no-console
      console.error("Image Upload failed:", error);
    },
    croppingAspectRatio,
  });

  const { openDialog } = useDialog();
  const imageId = field.state.value || '';

  const removeImg = () => {
    field.handleChange(null);
  };

  const formPreviewSize = formPreviewSizeByImageType[imageType];
  if (!formPreviewSize) throw new Error("Unsupported image upload type")

  return (
    <div className={classes.root}>
      <div className={classNames(!horizontal && classes.imgVertical)}>
        {imageId &&
          <CloudinaryImage2
            publicId={imageId}
            {...formPreviewSize}
          />
        }
      </div>
      <div className={classNames(
        classes.buttons,
        !horizontal && classes.buttonsHorizontal,
        horizontal && classes.buttonsVertical,
      )}>
        <TriggerButton
          imageType={imageType}
          imageId={imageId}
          uploadImage={uploadImage}
          label={label}
          horizontal={horizontal}
        />
        {(imageType === 'eventImageId') && <Button
          variant="outlined"
          onClick={() => openDialog({
            name: "ImageUploadDefaultsDialog",
            contents: ({onClose}) => <ImageUploadDefaultsDialog onClose={onClose} onSelect={(id: string) => field.handleChange(id)} />
          })}
        >
          Choose from ours
        </Button>}
        {userHasDefaultProfilePhotos(currentUser) && imageType === 'profileImageId' &&
          <Button
            variant="outlined"
            onClick={() => openDialog({
              name: "ImageUploadDefaultsDialog",
              contents: ({onClose}) => <ImageUploadDefaultsDialog
                onClose={onClose}
                onSelect={(id: string) => field.handleChange(id)}
                type={"Profile"}
              />
            })}
          >
            Choose from ours
          </Button>
        }
        <RemoveButton
          imageType={imageType}
          imageId={imageId}
          removeImage={removeImg}
        />
      </div>
    </div>
  );
}
