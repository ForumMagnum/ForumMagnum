import React, { useState } from 'react';
import { Components } from 'meteor/vulcan:core';
import { hookToHoc } from '../../lib/hocUtils.js';

export const CommentBoxContext = React.createContext('commentBox');

export const CommentBoxManager = ({ children }) => {
  const [ componentName, setComponentName] = useState(null)
  const [ componentProps, setComponentProps] = useState(null)

  const CommentBoxComponent = componentName ? Components[componentName] : null;

  const close = () => {
    setComponentName(null)
    setComponentProps(null)
  }

  return (
    <CommentBoxContext.Provider value={{
      openCommentBox: ({componentName, componentProps}) => {
        setComponentName(componentName)
        setComponentProps(componentProps)
      },
      close: this.close
    }}>
      {children}
      {componentName &&
        <CommentBoxComponent
          {...componentProps}
          onClose={close}
        />
      }
    </CommentBoxContext.Provider>
  );
}

export const useCommentBox = () => React.useContext(CommentBoxContext);
export const withCommentBox = hookToHoc(useCommentBox);
export default withCommentBox;
