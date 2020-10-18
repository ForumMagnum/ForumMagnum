import React, { useState } from 'react';
import { Components } from '../../lib/vulcan-lib';
import { hookToHoc } from '../../lib/hocUtils';

interface CommentBoxContextType {
  openCommentBox: ({componentName, componentProps}: {componentName: string, componentProps: any})=>void,
  close: ()=>void,
}
export const CommentBoxContext = React.createContext<CommentBoxContextType|null>(null);

export const CommentBoxManager = ({ children }: {
  children: React.ReactNode
}) => {
  const [ componentName, setComponentName] = useState<string|null>(null)
  const [ componentProps, setComponentProps] = useState<Record<string,any>|null>(null)

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
      close: close
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

export const useCommentBox = (): CommentBoxContextType => React.useContext(CommentBoxContext)!;
export const withCommentBox = hookToHoc(useCommentBox);
export default withCommentBox;
