import React, { ComponentProps, useCallback, useMemo, useState } from 'react';
import { Components } from '../../lib/vulcan-lib';
import { hookToHoc } from '../../lib/hocUtils';
import type { CloseableComponent } from '../common/withDialog';

interface CommentBoxContextType {
  openCommentBox: <T extends CloseableComponent>({componentName, componentProps}: {componentName: T, componentProps: Omit<ComponentProps<ComponentTypes[T]>, 'onClose' | 'classes'>}) => void,
  close: () => void,
}
export const CommentBoxContext = React.createContext<CommentBoxContextType|null>(null);

export const CommentBoxManager = ({ children }: {
  children: React.ReactNode
}) => {
  const [ componentName, setComponentName] = useState<CloseableComponent|null>(null)
  const [ componentProps, setComponentProps] = useState<Record<string,any>|null>(null)

  const CommentBoxComponent = componentName ? Components[componentName] : null;

  const close = useCallback(() => {
    setComponentName(null)
    setComponentProps(null)
  }, []);
  const openCommentBox = useCallback(({componentName, componentProps}: {
    componentName: CloseableComponent,
    componentProps: AnyBecauseHard,
  }) => {
    setComponentName(componentName)
    setComponentProps(componentProps)
  }, []);
  const commentBoxContext = useMemo(
    () => ({ openCommentBox, close }),
    [openCommentBox, close]
  );

  return (
    <CommentBoxContext.Provider value={commentBoxContext}>
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
