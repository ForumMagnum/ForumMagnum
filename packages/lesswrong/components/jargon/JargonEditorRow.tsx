import React, { useState } from 'react';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { commentBodyStyles } from '@/themes/stylePiping';
import classNames from 'classnames';
import { useUpdate } from '@/lib/crud/withUpdate';
import Button from '@material-ui/core/Button';
import EditIcon from '@material-ui/icons/Edit';
import CloseIcon from '@material-ui/icons/Close';
const styles = (theme: ThemeType) => ({
  root: {
    width: '100%',
    display: 'flex',
    ...commentBodyStyles(theme),
    marginBottom: 0,
    marginTop: 0,
    alignItems: 'center',

  },
  flex: {
    display: 'flex',
    flexGrow: 1
  },
  toggleAndEdit: {
    marginRight: 8,
  },
  isActive: {
    display: 'flex',
    flexGrow: 1,
    border: '1px solid transparent',
    padding: 10,
    flexDirection: 'row',
    ...commentBodyStyles(theme),
    fontSize: '1.1rem',
    marginBottom: 0,
    marginTop: 0,
    // TODO: figure out how to manage border separators between active and inactive terms
    borderTop: theme.palette.border.commentBorder,
    borderBottom: theme.palette.border.commentBorder,
    '&:last-child': {
      borderBottom: 'none',
    }
  },
  input: {
    flexGrow: 1,
    marginRight: 8,
  },
  toggleSwitch: {
  },
  editButton: {
    cursor: 'pointer',
    fontSize: '1rem',
  },
  leftButtons: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  leftButton: {
    opacity: 0,
    '$root:hover &': {
      opacity: 1
    },
    minHeight: "auto !important",
    minWidth: "auto !important",
    cursor: 'pointer',
    height: 24,
    marginTop: 8,
    width: 16,
    marginRight: -8,
    marginLeft: 4,
  },
  inactive: {
    opacity: .5,
    cursor: 'pointer',
    paddingLeft: 10,
    paddingTop: 4,
    paddingBottom: 4,
    '&:hover': {
      opacity: 1,
    }
  }
});

export const JargonEditorRow = ({classes, jargonTerm}: {
  classes: ClassesType<typeof styles>,
  jargonTerm: JargonTermsFragment,
}) => {
  const { LWTooltip, WrappedSmartForm, ContentItemBody } = Components;

  const [isActive, setIsActive] = useState(jargonTerm.approved);
  const [edit, setEdit] = useState(false);
  const [hidden, setHidden] = useState(false);

  const {mutate: updateJargonTerm} = useUpdate({
    collectionName: "JargonTerms",
    fragmentName: 'JargonTermsFragment',
  });

  const handleActiveChange = (value: boolean) => {
    setIsActive(value);
    void updateJargonTerm({
      selector: { _id: jargonTerm._id },
      data: {
        approved: value
      },
    })
  }

  // TODO: remove this functionality
  const handleDelete = () => {
    setHidden(true);
    // void updateJargonTerm({
    //   selector: { _id: jargonTerm._id },
    //   data: {
    //     deleted: true
    //   },
    // })
  }

  if (hidden) return null;

  const handleDoubleClickhandleDoubleClick = () => {
    if (isActive) {
      setEdit(true);
    }
  };

  const termContentElement = <ContentItemBody dangerouslySetInnerHTML={{__html: jargonTerm?.contents?.originalContents?.data ?? ''}}/>;

  return <div className={classes.root}>
    {isActive &&<div className={classes.leftButtons}>
      <LWTooltip title="Hide this term (you can get it back later)">
        <span onClick={() => handleDelete()}>
          <CloseIcon className={classes.leftButton} />
        </span>
      </LWTooltip>
       <span onClick={() => setEdit(true)}>
        <EditIcon className={classes.leftButton} />
      </span>
    </div>}
    <div className={classNames(classes.flex, isActive && classes.isActive)}>
      {!isActive && <LWTooltip title={<div><p><em>Click to enable jargon hoverover</em></p>{termContentElement}</div>}>
        <div dangerouslySetInnerHTML={{__html: jargonTerm.term}} onClick={() => handleActiveChange(!isActive)} className={classes.inactive} />
      </LWTooltip>}
      {isActive && (edit
        ? <WrappedSmartForm
            collectionName="JargonTerms"
            documentId={jargonTerm._id}
            mutationFragment={getFragment('JargonTermsFragment')}
            queryFragment={getFragment('JargonTermsFragment')}
            successCallback={() => setEdit(false)}
            cancelCallback={() => setEdit(false)}
          />
        : termContentElement
      )}
    </div>
  </div>
}

const JargonEditorRowComponent = registerComponent('JargonEditorRow', JargonEditorRow, {styles});

declare global {
  interface ComponentTypes {
    JargonEditorRow: typeof JargonEditorRowComponent
  }
}
