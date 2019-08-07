import React, { PureComponent } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';

const styles = theme => ({
  root: {
    marginLeft: 12,
    marginRight: 12
  },
  placeholderWrapper: {
    marginTop: 12,
    marginBottom: 24,
    display: "flex",
    justifyContent: "space-between"
  },
  placeholder: {
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    fontWeight: 300,
    color: theme.palette.grey[600]
  },
  placeholderSubmit: {
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    color: theme.palette.grey[500],
    marginRight: 8
  }
}) 

class ShortformSubmitForm extends PureComponent {
  state = { expanded: false }
  
  render() {
    const { classes, successCallback, startCollapsed=false } = this.props
    const { expanded } = this.state
    const { CommentsNewForm } = Components;
    
    if (startCollapsed && !expanded) {
      return <div className={classes.root}>
        <Tooltip title="Click to begin writing a shortform post" placement="top-start">
          <div className={classes.placeholderWrapper} onClick={()=>this.setState({expanded: true})}>
            <div className={classes.placeholder}>Write shortform post</div>
            <div className={classes.placeholderSubmit}>SUBMIT</div>
          </div>
        </Tooltip>
      </div>
    }

    return (
      <div className={classes.root}>
        <CommentsNewForm
          prefilledProps={{shortform: true}}
          successCallback={successCallback}
          type="comment"
        />
      </div>
    );
  }
}

registerComponent('ShortformSubmitForm', ShortformSubmitForm, withStyles(styles, {name:"ShortformSubmitForm"}));