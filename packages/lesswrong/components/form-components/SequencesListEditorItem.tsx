import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import DragIcon from '@/lib/vendor/@material-ui/icons/src/DragHandle';
import RemoveIcon from '@/lib/vendor/@material-ui/icons/src/Close';
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";
import Loading from "../vulcan-core/Loading";

const SequencesPageFragmentQuery = gql(`
  query SequencesListEditorItem($documentId: String) {
    sequence(input: { selector: { documentId: $documentId } }) {
      result {
        ...SequencesPageFragment
      }
    }
  }
`);

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
  const { loading, data } = useQuery(SequencesPageFragmentQuery, {
    variables: { documentId: documentId },
  });
  const document = data?.sequence?.result;
  
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
    return <Loading />
  }
};

export default registerComponent('SequencesListEditorItem', SequencesListEditorItem, {styles});


