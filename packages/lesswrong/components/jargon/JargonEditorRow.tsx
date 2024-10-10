import React from 'react';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { commentBodyStyles } from '@/themes/stylePiping';
import classNames from 'classnames';
import { useUpdate } from '@/lib/crud/withUpdate';
import Button from '@material-ui/core/Button';

const styles = (theme: ThemeType) => ({
  root: {
    width: '100%',
  },
  flex: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    ...commentBodyStyles(theme),
  },
  isActive: {
    marginBottom: 12,
    border: '1px solid #e0e0e0',
    borderRadius: 4,
    padding: 8,
  },
  input: {
    flexGrow: 1,
    marginRight: 8,
  },
  toggleSwitch: {
    marginRight: 8,
  },
  edit: {
    textWrap: 'nowrap',
  },
  deleteButton: {
    opacity: 0,
    '$root:hover &': {
      opacity: 1
    },
    minHeight: "auto !important"
  },
});

export const JargonEditorRow = ({classes, jargonTerm}: {
  classes: ClassesType<typeof styles>,
  jargonTerm: JargonTermsFragment,
}) => {
  const { ToggleSwitch, WrappedSmartForm, ContentItemBody } = Components;

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

  return <div className={classes.root}>
    <div className={classNames(classes.flex, isActive && classes.isActive)}>
      <ToggleSwitch value={isActive} className={classes.toggleSwitch} setValue={handleActiveChange}/>
      {!isActive && <div contentEditable={true} dangerouslySetInnerHTML={{__html: jargonTerm.term}} />}
      {isActive && (
        edit ? 
          (<WrappedSmartForm
            collectionName="JargonTerms"
            documentId={jargonTerm._id}
            mutationFragment={getFragment('JargonTermsFragment')}
            queryFragment={getFragment('JargonTermsFragment')}
            successCallback={() => setEdit(false)}
          />) : 
          (<>
            <ContentItemBody dangerouslySetInnerHTML={{__html: jargonTerm?.contents?.originalContents?.data ?? ''}}/>
            <a className={classes.edit} onClick={() => setEdit(!edit)}>Edit</a>
          </>)
          )
      }
      <Button onClick={() => handleDelete()} className={classes.deleteButton}>X</Button>
    </div>
  </div>
}

const JargonEditorRowComponent = registerComponent('JargonEditorRow', JargonEditorRow, {styles});

declare global {
  interface ComponentTypes {
    JargonEditorRow: typeof JargonEditorRowComponent
  }
}
