import React from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import Checkbox from '@material-ui/core/Checkbox';

const styles = (theme: ThemeType) => ({
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
    display: "inline",
    cursor: "pointer",
  }
})

const FormComponentCheckbox = ({ classes, label, disabled=false, path, value }: FormComponentProps<boolean> & {
  classes: ClassesType<typeof styles>;
}, context: FormComponentContext<boolean>) => {
  return <div className={classes.root}>
    <Checkbox
      className={classes.size}
      checked={value}
      onChange={(event, checked) => {
        void context.updateCurrentValues({
          [path]: checked
        })
      }}
      disabled={disabled}
      disableRipple
    />
    <Components.Typography className={classes.inline} variant="body2" component="label">{label}</Components.Typography>
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

