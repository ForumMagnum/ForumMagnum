import React, { ComponentProps, useState } from 'react';
import { Components } from '../../lib/vulcan-lib';
import { hookToHoc } from '../../lib/hocUtils';

type FromPartial<T> = T extends Partial<infer U> ? U : never;

type CloseableComponents = {
  [T in keyof ComponentTypes]: FromPartial<ComponentTypes[T]['defaultProps']> extends { onClose: any } | undefined ? T : never
}[keyof ComponentTypes];

interface CommentBoxContextType {
  openCommentBox: <T extends CloseableComponents>({componentName, componentProps}: {componentName: T, componentProps: Omit<ComponentProps<ComponentTypes[T]>, 'onClose' | 'classes'>})=>void,
  close: ()=>void,
}
export const CommentBoxContext = React.createContext<CommentBoxContextType|null>(null);

export const CommentBoxManager = ({ children }: {
  children: React.ReactNode
}) => {
  const [ componentName, setComponentName] = useState<CloseableComponents|null>(null)
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
      {CommentBoxComponent && componentName &&
        <CommentBoxComponent
          {...componentProps as AnyBecauseHard}
          onClose={close}
        />
      }
    </CommentBoxContext.Provider>
  );
}

export const useCommentBox = (): CommentBoxContextType => React.useContext(CommentBoxContext)!;
export const withCommentBox = hookToHoc(useCommentBox);
export default withCommentBox;
