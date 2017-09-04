import React, { PropTypes, Component } from 'react';
import { Textarea } from 'formsy-react-components';

const EditTitle = (props) => {
    return (
        <Textarea className="posts-edit-header-title" {...props} layout="elementOnly" />
    )
}

export default EditTitle;
