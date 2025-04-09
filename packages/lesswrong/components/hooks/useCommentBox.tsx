import React, { useCallback, useMemo, useState } from 'react';
import { hookToHoc } from '../../lib/hocUtils';

type CommentBoxFn = (args: {onClose: () => void}) => React.ReactNode
interface CommentBoxContextType {
  openCommentBox: ({commentBox}: {commentBox: CommentBoxFn}) => void,
  close: () => void,
}
export const CommentBoxContext = React.createContext<CommentBoxContextType|null>(null);

export const CommentBoxManager = ({ children }: {
  children: React.ReactNode
}) => {
  const [ commentBox, setCommentBox] = useState<CommentBoxFn|null>(null)

  const close = useCallback(() => {
    setCommentBox(null);
  }, []);
  const openCommentBox = useCallback(({commentBox}: {
    commentBox: CommentBoxFn
  }) => {
    setCommentBox(() => commentBox);
  }, []);
  const commentBoxContext = useMemo(
    () => ({ openCommentBox, close }),
    [openCommentBox, close]
  );

  return (
    <CommentBoxContext.Provider value={commentBoxContext}>
      {children}
      {commentBox && <span>
        {commentBox({onClose: close})}
      </span>}
    </CommentBoxContext.Provider>
  );
}

export const useCommentBox = (): CommentBoxContextType => React.useContext(CommentBoxContext)!;
export const withCommentBox = hookToHoc(useCommentBox);
export default withCommentBox;
