import React from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../lib/vulcan-lib/components';
import Button from '@material-ui/core/Button';


const SubmitButton = ({ name, label }: {
  name: string;
  label: string;
}, context: any) => {
  const fieldName = name;
  return (<Button onClick={() => context.updateCurrentValues({[fieldName]: true}, true)}>
    {label}
  </Button>);
};

(SubmitButton as any).contextTypes = {
  updateCurrentValues: PropTypes.func,
};

// TODO: Figure out whether this component is actually being used. (It has no
// references in Lesswrong2 or Vulcan, but might be used by some library that
// vulcan-forms uses.)
const SubmitButtonComponent = registerComponent("SubmitButton", SubmitButton);

declare global {
  interface ComponentTypes {
    SubmitButton: typeof SubmitButtonComponent
  }
}

export default SubmitButtonComponent;
