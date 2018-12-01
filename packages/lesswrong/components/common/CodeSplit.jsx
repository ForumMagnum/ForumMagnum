import React from 'react';
import { withStyles } from '@material-ui/core/styles';

export const SplitComponentsContext = React.createContext('splitComponents');

export class SplitComponent {
  render() {
    const {name, importPath, importFn, ...otherProps} = this.props;
    
    if (loadedComponents[importPath]) {
      const LoadedComponent = loadedComponents[importPath];
      return <LoadedComponent {...otherProps}/>
    } else {
      // TODO
    }
  }
}

export function defineComponent({name, components, hocs=[], split=false...otherOptions})
{
  
}
