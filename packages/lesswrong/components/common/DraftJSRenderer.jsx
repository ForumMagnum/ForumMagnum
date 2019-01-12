import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { convertFromRaw } from 'draft-js';
import { draftToHTML } from '../../lib/editor/utils.js'

class DraftJSRenderer extends PureComponent {
  render() {
    console.log('who what? ----------------------------------------')
    let htmlBody = {__html: "<span>No description</span>"}
    try {
      const contentState = convertFromRaw(this.props.content);
      console.log('contentState', contentState)
      htmlBody = {__html: draftToHTML(contentState)};
    } catch(err) {
      //eslint-disable-next-line no-console
      console.error("invalid draftContentState", this.props.content);
    }
    return <div dangerouslySetInnerHTML={htmlBody}/>
  }
}

DraftJSRenderer.propTypes = {
  content: PropTypes.object.isRequired,
}

registerComponent("DraftJSRenderer", DraftJSRenderer);
