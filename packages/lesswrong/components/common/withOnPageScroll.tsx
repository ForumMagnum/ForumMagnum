import React, { Component } from 'react';
import { Meteor } from 'meteor/meteor';

export const useOnPageScroll = (onScrollFn: ()=>void) => {
  React.useEffect(() => {
    if (Meteor.isClient) {
      document.addEventListener('scroll', onScrollFn)
      
      return function cleanup() {
        document.removeEventListener('scroll', onScrollFn);
      };
    }
  });
}
