import { registerComponent } from '../../lib/vulcan-lib';
import React from 'react';

const Loading = props => {
  return (
    <div className={`spinner ${props.className}`}>
      <div className="bounce1"></div>
      <div className="bounce2"></div>
      <div className="bounce3"></div>
    </div>
  );
};

const LoadingComponent = registerComponent('Loading', Loading);

declare global {
  interface ComponentTypes {
    Loading: typeof LoadingComponent
  }
}

export default Loading;
