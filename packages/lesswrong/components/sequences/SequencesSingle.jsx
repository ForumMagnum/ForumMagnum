import { Components, registerComponent} from 'meteor/vulcan:core';
import React from 'react';
import defineComponent from '../../lib/defineComponent';

const SequencesSingle = (props, context) => {
  return <Components.SequencesPage documentId={props.params._id} />
};

export default defineComponent({
  name: 'SequencesSingle',
  component: SequencesSingle
});
