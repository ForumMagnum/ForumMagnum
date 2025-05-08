import React, { useState } from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { ConditionalVisibilityMode, conditionalVisibilityModes, ConditionalVisibilitySettings, EditConditionalVisibilityProps } from './conditionalVisibility';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import Select from '@/lib/vendor/@material-ui/core/src/Select';

const styles = defineStyles("EditConditionalVisibility", (theme: ThemeType) => ({
  root: {
    marginBottom: 4,
  },
  checkbox: {
    padding: 0,
    marginLeft: 8,
  },
  checkboxLabel: {
    ...theme.typography.commentStyle,
    fontSize: 14,
  },
  inputPageId: {
    marginLeft: 16,
  },
}));

export const EditConditionalVisibilityInner = ({initialState, setDocumentState}: EditConditionalVisibilityProps) => {
  const classes = useStyles(styles);
  const [state,setState] = useState(initialState);
  const changeValue = (newState: ConditionalVisibilitySettings) => {
    setDocumentState(newState);
    setState(newState);
  }
  const mode = conditionalVisibilityModes[state.type];
  const { MenuItem } = Components;

  return <div
    className={classes.root} contentEditable={false}
    data-cke-ignore-events={true}
  >
    <Select
      value={state.type}
      onChange={(e) => {
        changeValue(conditionalVisibilityModes[e.target.value as ConditionalVisibilityMode].settings);
      }}
    >
      {Object.keys(conditionalVisibilityModes).map((mode: ConditionalVisibilityMode) => <MenuItem
        key={mode}
        value={mode}
      >
        {conditionalVisibilityModes[mode]?.label}
      </MenuItem>)}
    </Select>
    
    {(state.type==="knowsRequisite" || state.type==="wantsRequisite" || state.type==="ifPathBeforeOrAfter") && <>
      <Checkbox
        className={classes.checkbox}
        checked={state.inverted}
        onChange={ev => changeValue({...state, inverted: !state.inverted})}
      />
      <span className={classes.checkboxLabel}>{" Not"}</span>
    </>}
    {state.type==="ifPathBeforeOrAfter" && <>
      <Select
        value={state.order}
        onChange={(e) => {
          changeValue({...state, order: e.target.value as "after"|"before"});
        }}
      >
        <MenuItem value="after">After</MenuItem>
        <MenuItem value="before">Before</MenuItem>
      </Select>
    </>}
    {(state.type==="knowsRequisite" || state.type==="wantsRequisite" || state.type==="ifPathBeforeOrAfter") &&
      <Input
        className={classes.inputPageId}
        value={state.otherPage}
        placeholder="Page slug or ID"
        onChange={ev => {
          changeValue({...state, otherPage: ev.target.value});
        }}
      />
    }
  </div>
}

export const EditConditionalVisibility = registerComponent('EditConditionalVisibility', EditConditionalVisibilityInner);

declare global {
  interface ComponentTypes {
    EditConditionalVisibility: typeof EditConditionalVisibility
  }
}

