import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import { compose } from 'react-apollo';

export function defineComponent({name, component, split, styles, hocs})
{
  component.displayName = name;
  
  if (styles) {
    hocs = _.clone(hocs);
    hocs.push(withStyles(styles, {name: name}));
  }
  
  if (split) {
    const hocsExecuted = hocs.map(hoc => {
      if(!Array.isArray(hoc)) return hoc;
      const [actualHoc, ...args] = hoc;
      return actualHoc(...args);
    });
    const componentWithHocs = compose(...hocsExecuted)(component);
    return componentWithHocs;
  } else {
    registerComponent(name, component, ...hocs);
  }
}
