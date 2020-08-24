import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../lib/vulcan-lib';
import InputAdornment from '@material-ui/core/InputAdornment';
import classNames from 'classnames'
import Input from '@material-ui/core/Input';
import LinkIcon from '@material-ui/icons/Link'
import LinkOffIcon from '@material-ui/icons/LinkOff';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginRight: theme.spacing.unit
  },
  input: {
    marginLeft: 5,
    display: 'inline-block',
    overflow: 'hidden',
    transition: 'width 0.25s',
    width: 150,
  },
  hideInput: {
    width: 28,
  },
  button: {
    '&:hover': {
      cursor:'pointer'
    }
  },
  innerInput: {
    padding: '6px 0 7px'
  }
})

interface EditUrlProps extends WithStylesProps{
  document: any,
  value: any,
  defaultValue: any,
  label: string,
  hintText: string,
  placeholder: string,
  path: string,
}
interface EditUrlState {
  active: boolean,
}
class EditUrl extends Component<EditUrlProps,EditUrlState> {
  state: EditUrlState = {
    active: !!this.props.value
  }

  toggleEditor = () => {
    this.setState({active: !this.state.active}, () => {
      if (!this.state.active) { // Reset the URL when you deactivate the URL editor
        this.context.updateCurrentValues({
          [this.props.path]: null
        })
      }
    })
  }

  onChange = (event) => {
    this.context.updateCurrentValues({
      [this.props.path]: event.target.value
    })
  }

  render() {
    const active = this.state.active
    const { classes, document, path, defaultValue, label, hintText, placeholder } = this.props;
    
    const startAdornmentInactive = <InputAdornment className={classes.button} onClick={this.toggleEditor} position="start">
      <LinkIcon/>
    </InputAdornment>
    const startAdornmentActive = <InputAdornment className={classes.button} onClick={this.toggleEditor} position="start">
      <LinkOffIcon/></InputAdornment>
    
    return (
      <div className={classes.root}>
        <div>
          <span className={classNames(classes.input, {[classes.hideInput]: !active})}>
              <Input
                className={classes.innerInput}
                value={(document && document[path]) || defaultValue || ""}
                onChange={this.onChange}
                placeholder={hintText || placeholder || label}
                disableUnderline={!active}
                classes={{input: classes.input}}
                startAdornment={active ? startAdornmentActive : startAdornmentInactive}
              />
          </span>
        </div>
      </div>
    )
  }
};

(EditUrl as any).contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
  addToSubmitForm: PropTypes.func,
};

export const EditUrlComponent = registerComponent("EditUrl", EditUrl, {styles});

declare global {
  interface ComponentTypes {
    EditUrl: typeof EditUrlComponent
  }
}
