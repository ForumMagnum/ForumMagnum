import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Components, Utils } from 'meteor/vulcan:core';
import { convertFromRaw } from 'draft-js';
import defineComponent from '../../lib/defineComponent';

class DraftJSRenderer extends PureComponent {
  render() {
    let htmlBody = {__html: "<span>No description</span>"}
    try {
      const contentState = convertFromRaw(this.props.content);
      htmlBody = {__html: Utils.draftToHTML(contentState)};
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

export default defineComponent({
  name: "DraftJSRenderer",
  component: DraftJSRenderer
});
