import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {SortableContainer, SortableElement, arrayMove} from 'react-sortable-hoc';
import { registerComponent, Components, withCurrentUser } from 'meteor/vulcan:core';

// React sortable has constructors that don't work like normal constructors
//eslint-disable-next-line babel/new-cap
const SortableItem = SortableElement(({sequenceId, currentUser, removeItem}) =>
  <li className="sequences-list-editor-item">
    <Components.SequencesListEditorItem documentId={sequenceId} currentUser={currentUser} removeItem={removeItem} />
  </li>
);
// React sortable has constructors that don't work like normal constructors
//eslint-disable-next-line babel/new-cap
const SortableList = SortableContainer(({items, currentUser, removeItem}) => {
  if (items) {
    return (
      <div>
        {items.map((sequenceId, index) => (
          <SortableItem key={`item-${index}`} removeItem={removeItem} index={index} sequenceId={sequenceId} currentUser={currentUser}/>
        ))}
      </div>
    );
  } else {
    return <div>No Sequences added yet</div>
  }

});

class SequencesListEditor extends Component {
  constructor(props, context) {
    super(props, context);
    const fieldName = props.name;
    let sequenceIds = [];
    if (props.document[fieldName]) {
      sequenceIds = _.compact(JSON.parse(JSON.stringify(props.document[fieldName])));
    }
    this.state = {
      sequenceIds: sequenceIds,
    }
    const addValues = this.context.updateCurrentValues;
    addValues({[fieldName]: sequenceIds});

    const addToSuccessForm = this.context.addToSuccessForm;
    addToSuccessForm((results) => this.resetSequenceIds(results));
  }
  onSortEnd = ({oldIndex, newIndex}) => {
    const fieldName = this.props.name;
    const addValues = this.context.updateCurrentValues;
    const newIds = arrayMove(this.state.sequenceIds, oldIndex, newIndex);
    this.setState({
      sequenceIds: newIds,
    });
    addValues({[fieldName]: newIds});
  };
  addSequenceId = (sequenceId) => {
    const newIds = _.compact([...this.state.sequenceIds, sequenceId]);
    this.setState({
      sequenceIds: newIds,
    })
    const fieldName = this.props.name;
    const addValues = this.context.updateCurrentValues;
    addValues({[fieldName]: newIds});
  }
  removeSequenceId = (sequenceId) => {
    const newIds = _.without(this.state.sequenceIds, sequenceId);
    this.setState({
      sequenceIds: newIds || [],
    })
    const fieldName = this.props.name;
    const addValues = this.context.updateCurrentValues;
    addValues({[fieldName]: newIds});
  }
  resetSequenceIds = (args) => {
    this.setState({
      sequenceIds: [],
    })
    return args;
  }

  shouldCancelStart = (e) => {
    // Cancel sorting if the event target is an `input`, `textarea`, `select`, 'option' or 'svg'
    const disabledElements = ['input', 'textarea', 'select', 'option', 'button', 'svg'];
    if (disabledElements.indexOf(e.target.tagName.toLowerCase()) !== -1) {
      return true; // Return true to cancel sorting
    }
  }

  render() {
    return <div className="sequences-list-editor">
      <SortableList items={this.state.sequenceIds} onSortEnd={this.onSortEnd} currentUser={this.props.currentUser} removeItem={this.removeSequenceId} shouldCancelStart={this.shouldCancelStart}/>
      <Components.SequencesSearchAutoComplete clickAction={this.addSequenceId}/>
    </div>
  }
}

//

SequencesListEditor.contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
};

registerComponent("SequencesListEditor", SequencesListEditor, withCurrentUser);
