import React from 'react';

export const hookToHoc = (hookFn) => {
  return (Component) => (props) => {
    const hookProps = hookFn(props);
    return <Component {...props} {...hookProps}/>;
  }
}
