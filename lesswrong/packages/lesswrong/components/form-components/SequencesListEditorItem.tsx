import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import React from 'react';
import DragIcon from '@material-ui/icons/DragHandle';
import RemoveIcon from '@material-ui/icons/Close';

const styles = (theme: ThemeType) => ({
  box: {
    display: "block",
    marginLeft: 30,
    "&:hover $remove": {
      opacity: 1,
    }
  },
  title: {
    display: "inline",
    marginRight: 10,
    fontSize: 20,
    lineHeight: 1.25,
    ...theme.typography.smallCaps,
  },
  meta: {
    display: "inline-block",
    color: theme.palette.text.dim,
    "& div": {
      display: "inline-block",
      marginRight: 5,
    }
  },
  remove: {
    opacity: 0,
    position: "absolute",
    right: 0,
    cursor: "pointer",
  },
  removeIcon: {
    color: `${theme.palette.icon.dim5} !important`
  },
  dragHandle: {
    pointerEvents: "none",
    position: "absolute",
    display: "block !important",
    color: theme.palette.icon.dim,
    margin: "auto",
    top: "0px",
    bottom: "0px",
    cursor: "pointer"
  },
});

const SequencesListEditorItem = ({documentId, removeItem, classes}: {
  documentId: string;
  removeItem: (itemId: string) => void;
  classes: ClassesType<typeof styles>;
}) => {
  const { document, loading } = useSingle({
    documentId,
    collectionName: "Sequences",
    fragmentName: 'SequencesPageFragment',
  });
  
  if (document && !loading) {
    return <div>
      <DragIcon className={classes.dragHandle}/>
      <div className={classes.box}>
        <div className={classes.title}>
          {document.title || "Undefined Title"}
        </div>
        <div className={classes.meta}>
          <div className="sequences-list-edit-item-author">
            {(document.user && document.user.displayName) || "Undefined Author"}
          </div>
          <div className={classes.remove}>
            <RemoveIcon className={classes.removeIcon} onClick={() => removeItem(documentId)} />
          </div>
        </div>
      </div>
    </div>
  } else {
    return <Components.Loading />
  }
};

const SequencesListEditorItemComponent = registerComponent('SequencesListEditorItem', SequencesListEditorItem, {styles});

declare global {
  interface ComponentTypes {
    SequencesListEditorItem: typeof SequencesListEditorItemComponent
  }
}
