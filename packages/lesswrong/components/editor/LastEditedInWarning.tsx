import React, { useEffect } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { getEditorTypeToDisplayMap, EditorTypeString, EditorContents, EditorChangeEvent, type LegacyEditorTypeString } from './Editor';
import { useConvertDocument } from './useConvertDocument';
import Loading from "../vulcan-core/Loading";
import { Typography } from "../common/Typography";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('LastEditedInWarning', (theme: ThemeType) => ({
  lastEditedWarning: {
    color: theme.palette.error.main,
  },
  clickHereColor: {
    color: theme.palette.primary.main
  },
}));

const LastEditedInWarning = ({autoConvert, initialType, currentType, defaultType, value, setValue}: {
  autoConvert: boolean,
  initialType: LegacyEditorTypeString,
  currentType: LegacyEditorTypeString,
  defaultType: LegacyEditorTypeString,
  value: EditorContents,
  setValue: (change: EditorChangeEvent) => void,
}) => {
  const classes = useStyles(styles);
  const {convertDocument, loading, error} = useConvertDocument({
    onCompleted: (result: EditorContents) => {
      setValue({
        contents: result,
        autosave: false,
      });
    }
  });
  
  useEffect(() => {
    if (autoConvert) {
      setTimeout(() => {
        convertDocument(value, 'ckEditorMarkup');
      }, 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConvert]);
  
  return <div>
    {loading && <Loading/>}
    <Typography variant="body2" className={classes.lastEditedWarning}>
      This document was last saved in {getEditorTypeToDisplayMap()[initialType].name} format.{' '}
      {autoConvert
        ? <>Converting...</>
        : <>Showing the {getEditorTypeToDisplayMap()[currentType].name} editor.</>
      }
      {!autoConvert && <>
        <a
          className={classes.clickHereColor}
          onClick={() => {
            convertDocument(value, 'ckEditorMarkup');
          }}
        >
          Click here
        </a>
        {' '}to switch to the {getEditorTypeToDisplayMap()['ckEditorMarkup'].name} editor (the default editor).
      </>}
    </Typography>
    <br/>
  </div>
}

export default registerComponent('LastEditedInWarning', LastEditedInWarning, {styles});


