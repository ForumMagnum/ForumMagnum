import React from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../lib/vulcan-lib';
import Checkbox from '@material-ui/core/Checkbox';
import Typography from '@material-ui/core/Typography';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginRight:theme.spacing.unit*3,
    marginTop: 5,
    display: "flex",
    alignItems: "center"
  },
  size: {
    width:36,
    height:0
  },
  inline: {
    display:"inline",
  }
})

const FormComponentCheckbox = ({ classes, label, disabled=false, path, value }, context) => {
  return <div className={classes.root}>
    <Checkbox
      className={classes.size}
      checked={value}
      onChange={(event, checked) => {
        context.updateCurrentValues({
          [path]: checked
        })
      }}
      disabled={disabled}
      disableRipple
    />
    <Typography className={classes.inline} variant="body2" component="label">{label}</Typography>
  </div>
}

(FormComponentCheckbox as any).contextTypes = {
  updateCurrentValues: PropTypes.func,
};

// Replaces FormComponentCheckbox from vulcan-ui-bootstrap
const FormComponentCheckboxComponent = registerComponent("FormComponentCheckbox", FormComponentCheckbox, {styles});

declare global {
  interface ComponentTypes {
    FormComponentCheckbox: typeof FormComponentCheckboxComponent
  }
}

