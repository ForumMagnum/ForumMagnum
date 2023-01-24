import React from 'react';
import PropTypes from 'prop-types';
import {Components, registerComponent } from '../../lib/vulcan-lib';
import { siteImageSetting } from '../vulcan-core/App';

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

const SocialPreviewUpload = ({name, document, updateCurrentValues, clearField, label, croppingAspectRatio, classes}: {
  name: string,
  document: Object,
  updateCurrentValues: Function,
  clearField: Function,
  label: string,
  croppingAspectRatio?: number,
  classes: ClassesType
}) => {
  const { ImageUpload2 } = Components

  return (
    <div>
      <ImageUpload2
        name={name}
        document={document}
        updateCurrentValues={updateCurrentValues}
        clearField={clearField}
        label={label}
        croppingAspectRatio={croppingAspectRatio}
        placeholderUrl={siteImageSetting.get()}
      />
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
