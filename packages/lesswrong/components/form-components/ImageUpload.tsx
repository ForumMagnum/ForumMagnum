/* global cloudinary */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {Components, registerComponent } from '../../lib/vulcan-lib';
import { Helmet } from 'react-helmet';
import Button from '@material-ui/core/Button';
import ImageIcon from '@material-ui/icons/Image';
import classNames from 'classnames';
import { cloudinaryCloudNameSetting, DatabasePublicSetting } from '../../lib/publicSettings';
import forumThemeExport from '../../themes/forumTheme';

const cloudinaryUploadPresetGridImageSetting = new DatabasePublicSetting<string>('cloudinary.uploadPresetGridImage', 'tz0mgw2s')
const cloudinaryUploadPresetBannerSetting = new DatabasePublicSetting<string>('cloudinary.uploadPresetBanner', 'navcjwf7')
const cloudinaryUploadPresetSocialPreviewSetting = new DatabasePublicSetting<string | null>('cloudinary.uploadPresetSocialPreview', null)

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
    marginRight: theme.spacing.unit
  },
  removeButton: {
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
    minImageHeight: 380,
    minImageWidth: 1600,
    croppingAspectRatio: 2.5375,
    croppingDefaultSelectionRatio: 3,
    uploadPreset: cloudinaryUploadPresetBannerSetting.get(),
  },
  socialPreviewImageId: {
    minImageHeight: 400,
    minImageWidth: 700,
    croppingAspectRatio: 1.91,
    croppingDefaultSelectionRatio: 3,
    uploadPreset: cloudinaryUploadPresetSocialPreviewSetting.get(),
  },
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
}

class ImageUpload extends Component<any,any> {
  constructor(props, context) {
    super(props, context);
    const fieldName = props.name;
    let imageId = "";
    if (props.document && props.document[fieldName]) {
      imageId = props.document[fieldName];
    }
    this.state = {
      imageId,
    }
    const addValues = context.updateCurrentValues;
    const addToSuccessForm = context.addToSuccessForm;
    addValues({[fieldName]: imageId});
    addToSuccessForm((results) => this.setImageInfo({} ,""));
  }

  setImageInfo = (error, result) => {
    // currently we ignore all events other than a successful upload -
    // see list here: https://cloudinary.com/documentation/upload_widget_reference#events
    if (error || result.event !== 'success') {
      return
    }
    const imageInfo = result.info
    if (imageInfo && imageInfo.public_id) {
      this.setState({imageId: imageInfo.public_id});
      const addValues = this.context.updateCurrentValues;
      const fieldName = this.props.name;
      addValues({[fieldName]: imageInfo.public_id})
    } else {
      //eslint-disable-next-line no-console
      console.error("Image Upload failed");
    }
  }

  uploadWidget = () => {
    const cloudinaryArgs = cloudinaryArgsByImageType[this.props.name]
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
    }, this.setImageInfo);
  }
  
  removeImg = () => {
    this.props.clearField();
    this.setState({imageId: null});
  }
  
  render(){
    const { classes, name, label } = this.props;
    const formPreviewSize = formPreviewSizeByImageType[name]
    if (!formPreviewSize) throw new Error("Unsupported image upload type")
    
    return (
      <div className={classes.root}>
        <Helmet>
          <script src="https://upload-widget.cloudinary.com/global/all.js" type="text/javascript"/>
          <script src='//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js'/>
        </Helmet>
        {this.state.imageId &&
          <Components.CloudinaryImage
            publicId={this.state.imageId}
            {...formPreviewSize}
          /> }
        <Button
          onClick={this.uploadWidget}
          className={classNames("image-upload-button", classes.button)}
        >
          <ImageIcon className={classes.imageIcon}/>
          {this.state.imageId ? `Replace ${label}` : `Upload ${label}`}
        </Button>
        {this.state.imageId && <Button
          className={classes.removeButton}
          title="Remove"
          onClick={this.removeImg}
        >
          Remove {label}
        </Button>}
      </div>
    );
  }
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
