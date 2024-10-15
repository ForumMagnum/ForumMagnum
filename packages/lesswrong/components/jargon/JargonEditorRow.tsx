import React from 'react';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { commentBodyStyles } from '@/themes/stylePiping';
import classNames from 'classnames';
import { useUpdate } from '@/lib/crud/withUpdate';
import Button from '@material-ui/core/Button';

const styles = (theme: ThemeType) => ({
  root: {
    width: '100%',
    display: 'flex',
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
    position: 'absolute',
    right: 8,
    bottom: 8,
    fontSize: '1rem',
    color: theme.palette.grey[500],
    textWrap: 'nowrap',
  },
  deleteButton: {
    opacity: 0,
    '$root:hover &': {
      opacity: 1
    },
    minHeight: "auto !important",
    minWidth: "auto !important",
    height: 24,
    marginTop: 8,
    width: 16,
    marginRight: -8,
    marginLeft: 4,
  },
  active: {
    cursor: 'pointer',
    opacity: 1,
  },
  inactive: {
    opacity: .5,
    cursor: 'pointer',
    paddingLeft: 10,
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

  const [isActive, setIsActive] = React.useState(!jargonTerm.rejected);
  const [edit, setEdit] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);

  const {mutate: updateJargonTerm} = useUpdate({
    collectionName: "JargonTerms",
    fragmentName: 'JargonTermsFragment',
  });

  const handleActiveChange = (value: boolean) => {
    setIsActive(value);
    void updateJargonTerm({
      selector: { _id: jargonTerm._id },
      data: {
        rejected: !value
      },
    })
  }

  const handleDelete = () => {
    setHidden(true);
    void updateJargonTerm({
      selector: { _id: jargonTerm._id },
      data: {
        deleted: true
      },
    })
  }

  if (hidden) return null;

  const handleDoubleClick = () => {
    if (isActive) {
      setEdit(true);
    }
  };

  const termContentElement = <ContentItemBody dangerouslySetInnerHTML={{__html: jargonTerm?.contents?.originalContents?.data ?? ''}}/>;

  return <div className={classes.root}>
    <div className={classNames(classes.flex, isActive && classes.isActive)} onDoubleClick={() => isActive && setEdit(true)}>
      {/* <div className={classes.toggleAndEdit}>
        <ToggleSwitch value={isActive} className={classes.toggleSwitch} setValue={handleActiveChange}/>
        {isActive && <a className={classes.editButton} onClick={() => setEdit(!edit)}>Edit</a>}
      </div> */}
      {!isActive && <LWTooltip title={termContentElement} placement='left-start'>
        <div dangerouslySetInnerHTML={{__html: jargonTerm.term}} onClick={() => handleActiveChange(!isActive)} className={classes.inactive} />
      </LWTooltip>}
      {/** TODO: do we need to use the .active classname anywhere? */}
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
    <div>
      <LWTooltip title="Hide this term (you can get it back later)">
        <Button onClick={() => handleDelete()} className={classes.deleteButton}>X</Button>
      </LWTooltip>
    </div>
    {isActive && <div className={classes.editButton}>Doubleclick to edit</div>}
  </div>
}

const JargonEditorRowComponent = registerComponent('JargonEditorRow', JargonEditorRow, {styles});

declare global {
  interface ComponentTypes {
    JargonEditorRow: typeof JargonEditorRowComponent
  }
}
