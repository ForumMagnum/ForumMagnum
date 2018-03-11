/* global google */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components, Utils } from 'meteor/vulcan:core';
import { convertFromRaw } from 'draft-js';

class DraftJSRenderer extends PureComponent {
  render() {
    let htmlBody = {__html: "<span>No description</span>"}
    try {
      const contentState = convertFromRaw(this.props.content);
      htmlBody = {__html: Utils.draftToHTML(contentState)};
    } catch(err) {
      console.log("invalid draftContentState", this.props.content);
    }
    return <div dangerouslySetInnerHTML={htmlBody}/>
  }
}

DraftJSRenderer.propTypes = {
  content: PropTypes.object.isRequired,
}

registerComponent("DraftJSRenderer", DraftJSRenderer);
