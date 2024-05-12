import React, { useEffect, useState } from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib";
import PropTypes from 'prop-types';

const styles = (theme: ThemeType): JssStyles => ({
})

const EditorUnmanaged = ({classes}: {
  classes: ClassesType,
}, context: any) => {
  useEffect(() => {
    const cleanupSubmitForm = context.addToSubmitForm(async (submission: any) => {
      // TODO
    });
    return () => {
      cleanupSubmitForm();
    }
  });
  const [text,setText] = useState("");

  return <textarea
    value={text}
    onChange={ev => {
      setText(ev.target.value);
    }}
  />
}

const EditorUnmanagedComponent = registerComponent('EditorUnmanaged', EditorUnmanaged, {styles});

(EditorUnmanaged as any).contextTypes = {
  addToSubmitForm: PropTypes.func,
  addToSuccessForm: PropTypes.func,
  updateCurrentValues: PropTypes.func,
  submitForm: PropTypes.func,
};

declare global {
  interface ComponentTypes {
    EditorUnmanaged: typeof EditorUnmanagedComponent
  }
}

