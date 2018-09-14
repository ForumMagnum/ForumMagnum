import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import { compose } from 'react-apollo';

const defineComponent = ({ component, name, styles=null, register=true, hocs=[] }) =>
{
  component.displayName = name;
  
  if(styles) {
    hocs.push(withStyles(styles, { name: name }));
  }
  
  if(register) {
    registerComponent(name, component, ...hocs);
  } else {
    let partiallyAppliedHocs = hocs.map(hoc => Array.isArray(hoc) ? hoc[0](hoc[1]) : hoc);
    return compose(...partiallyAppliedHocs)(component);
  }
}

export default defineComponent;