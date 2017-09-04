import React, { PropTypes, Component } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import FlatButton from 'material-ui/FlatButton';
import { Input } from 'formsy-react-components';

class EditUrl extends Component {
  constructor(props, context) {
    super(props,context);
    const document = this.props.document;
    const fieldName = this.props.name;
        
    this.state = {
      active: false,
    };
  }

  toggleEditor = () => {this.setState({active: !this.state.active})}
    
  render() {
    return (
      <div className="commentEditor">
        <div className="row">
          <div className="col-md-3">
            <FlatButton 
              backgroundColor={this.state.active ? "#555" : "#999"}
              hoverColor={this.state.active ? "#666" : "#aaa"}
              style={{color: "#fff"}}
              label={this.state.active ? "Create Text Post" : "Create Link Post" }
              onTouchTap={this.toggleEditor}/>
          </div>
          <div className="col-md-9">
            <Input {...this.props} hidden={ !this.state.active} layout="elementOnly" /> 
          </div>
        </div>
      </div>
    )
  }
}

EditUrl.contextTypes = {
  addToAutofilledValues: React.PropTypes.func,
  addToSuccessForm: React.PropTypes.func,
  addToSubmitForm: React.PropTypes.func,
};

registerComponent("EditUrl", EditUrl);

export default EditUrl;
