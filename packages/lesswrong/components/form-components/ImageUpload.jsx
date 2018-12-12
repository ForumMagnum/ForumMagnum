/* global cloudinary */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {Components, registerComponent, getSetting} from 'meteor/vulcan:core';
import Helmet from 'react-helmet';
import Button from '@material-ui/core/Button';
import ImageIcon from '@material-ui/icons/Image';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

const styles = theme => ({
  button: {
    background: "rgba(0,0,0, 0.5)",
    "&:hover": {
      background: "rgba(0,0,0,.35)"
    },
    color: "white",
  }
});

class ImageUpload extends Component {
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
    let min_image_height, min_image_width, cropping_aspect_ratio, cropping_default_selection_ratio, upload_preset;
    if (this.props.name == "gridImageId") {
      min_image_height = 80;
      min_image_width = 203;
      cropping_aspect_ratio = 2.5375;
      upload_preset = getSetting('cloudinary.uploadPresetGridImage', 'tz0mgw2s');
    } else if (this.props.name == "bannerImageId") {
      min_image_height = 380;
      min_image_width = 1600;
      cropping_aspect_ratio = 2.5375;
      cropping_default_selection_ratio = 3;
      upload_preset = getSetting('cloudinary.uploadPresetBanner', 'navcjwf7');
    }
    cloudinary.openUploadWidget(
      {cropping: "server",
      cloud_name: getSetting('cloudinary.cloudName', 'lesswrong-2-0'),
      upload_preset,
      theme: 'minimal',
      min_image_height,
      min_image_width,
      cropping_validate_dimension: true,
      cropping_show_dimensions: true,
      cropping_default_selection_ratio,
      cropping_aspect_ratio
    }, this.setImageInfo);
  }
  render(){
    const { classes } = this.props;
    
    return (
      <div className="upload">
        <Helmet>
          <script src="https://widget.cloudinary.com/global/all.js" type="text/javascript"/>
          <script src='//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js'/>
        </Helmet>
        <div className="image-upload-description">{this.props.label}</div>
        {this.state.imageId &&
          <Components.CloudinaryImage
            publicId={this.state.imageId}
            width={this.props.name == "gridImageId" ? "203" : "auto"}
            height={this.props.name == "bannerImageId" ? "380" : "80"}
          /> }
        <Button
          onClick={this.uploadWidget}
          className={classNames("image-upload-button", classes.button)}
        >
          <ImageIcon/>
          {this.state.imageId ? `Replace ${this.props.label}` : `Upload ${this.props.label}`}
        </Button>
      </div>
    );
  }
}

ImageUpload.displayName = "ImageUpload"

ImageUpload.contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
};

registerComponent("ImageUpload", ImageUpload, withStyles(styles, {name: "ImageUpload"}));
