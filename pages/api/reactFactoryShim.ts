import React from 'react';

if (!(React as any).createFactory) {
  (React as any).createFactory = (Component: any) => {
    return function(props: any, ...children: any[]) {
      return React.createElement(Component, props, ...children);
    };
  };
}
