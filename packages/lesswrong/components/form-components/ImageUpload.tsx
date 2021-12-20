/* global cloudinary */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {Components, registerComponent } from '../../lib/vulcan-lib';
import { Helmet } from 'react-helmet';
import Button from '@material-ui/core/Button';
import ImageIcon from '@material-ui/icons/Image';
import classNames from 'classnames';
import { cloudinaryCloudNameSetting, DatabasePublicSetting } from '../../lib/publicSettings';

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
    min_image_height: 80,
    min_image_width: 203,
    cropping_aspect_ratio: 2.5375,
    upload_preset: cloudinaryUploadPresetGridImageSetting.get(),
  },
  bannerImageId: {
    min_image_height: 380,
    min_image_width: 1600,
    cropping_aspect_ratio: 2.5375,
    cropping_default_selection_ratio: 3,
    upload_preset: cloudinaryUploadPresetBannerSetting.get(),
  },
  socialPreviewImageId: {
    min_image_height: 400,
    min_image_width: 700,
    cropping_aspect_ratio: 1.91,
    cropping_default_selection_ratio: 3,
    upload_preset: cloudinaryUploadPresetSocialPreviewSetting.get(),
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

  setImageInfo = (error, imageInfo) => {
    if (imageInfo && imageInfo[0] && imageInfo[0].public_id ) {
      this.setState({imageId: imageInfo[0].public_id});
      const addValues = this.context.updateCurrentValues;
      const fieldName = this.props.name;
      addValues({[fieldName]: imageInfo[0].public_id})
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
      cropping: "server",
      cloud_name: cloudinaryCloudNameSetting.get(),
      theme: 'minimal',
      cropping_validate_dimension: true,
      cropping_show_dimensions: true,
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
          <script src="https://widget.cloudinary.com/global/all.js" type="text/javascript"/>
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
