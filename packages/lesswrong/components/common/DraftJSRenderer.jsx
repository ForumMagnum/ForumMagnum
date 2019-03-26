import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from 'meteor/vulcan:core';
import { convertFromRaw } from 'draft-js';
import { draftToHTML } from '../../lib/editor/utils.js'

class DraftJSRenderer extends PureComponent {
  render() {
    let html = {__html: "<span>No description</span>"}
    try {
      const contentState = convertFromRaw(this.props.content);
      html = {__html: draftToHTML(contentState)};
    } catch(err) {
      //eslint-disable-next-line no-console
      console.error("invalid draftContentState", this.props.content);
    }
    return <div dangerouslySetInnerHTML={html}/>
  }
}

DraftJSRenderer.propTypes = {
  content: PropTypes.object.isRequired,
}

registerComponent("DraftJSRenderer", DraftJSRenderer);
