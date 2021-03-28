import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {SortableContainer, SortableElement, arrayMove} from 'react-sortable-hoc';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import withUser from '../common/withUser';
import * as _ from 'underscore';

const styles = (theme: ThemeType): JssStyles => ({
  editor: {
    "& .ais-InstantSearch__root": {
      margin: "20px 0",
    },
    "& .posts-list-editor-item": {
      listStyle: "none",
      position: "relative",
      padding: 5,
      cursor: "pointer",
    },
  },
});

// React sortable has constructors that don't work like normal constructors
//eslint-disable-next-line babel/new-cap
const SortableItem = SortableElement(({postId, currentUser, removeItem}) =>
  <li className="posts-list-editor-item">
    <Components.PostsItemWrapper documentId={postId} removeItem={removeItem} />
  </li>
);

// React sortable has constructors that don't work like normal constructors
//eslint-disable-next-line babel/new-cap
const SortableList = SortableContainer(({items, currentUser, removeItem}) => {
  return (
    <div>
      {items.map((postId: string, index: number) => (
        <SortableItem key={`item-${index}`} removeItem={removeItem} index={index} postId={postId} currentUser={currentUser}/>
      ))}
    </div>
  );
});

class PostsListEditor extends Component<any,any> {
  constructor(props, context) {
    super(props, context);
    const fieldName = props.name;
    let postIds = [];
    if (props.document[fieldName]) {
      postIds = JSON.parse(JSON.stringify(props.document[fieldName]));
    }
    this.state = {
      postIds: postIds,
    }
    const addValues = this.context.updateCurrentValues;
    addValues({[fieldName]: postIds});

    const addToSuccessForm = this.context.addToSuccessForm;
    addToSuccessForm((results) => this.resetPostIds(results));
  }
  onSortEnd = ({oldIndex, newIndex}: {oldIndex: number, newIndex: number}) => {
    const fieldName = this.props.name;
    const addValues = this.context.updateCurrentValues;
    const newIds = arrayMove(this.state.postIds, oldIndex, newIndex);
    this.setState({
      postIds: newIds,
    });
    addValues({[fieldName]: newIds});
  };
  addPostId = (postId: string) => {
    const newIds = [...this.state.postIds, postId];
    this.setState({
      postIds: newIds,
    })
    const fieldName = this.props.name;
    const addValues = this.context.updateCurrentValues;
    addValues({[fieldName]: newIds});
  }
  removePostId = (postId: string) => {
    const newIds = _.without(this.state.postIds, postId);
    this.setState({
      postIds: newIds,
    })
    const fieldName = this.props.name;
    const addValues = this.context.updateCurrentValues;
    addValues({[fieldName]: newIds});
  }
  resetPostIds = (args) => {
    this.setState({
      postIds: [],
    })
    return args;
  }

  shouldCancelStart = (e) => {
    // Cancel sorting if the event target is an `input`, `textarea`, `select`, 'option' or 'svg'
    const disabledElements = ['input', 'textarea', 'select', 'option', 'button', 'svg', 'path'];
    if (disabledElements.includes(e.target.tagName.toLowerCase())) {
      return true; // Return true to cancel sorting
    } else {
      return false;
    }
  }

  render() {
    const { classes } = this.props;
    return <div className={classes.editor}>
      <SortableList
        items={this.state.postIds}
        onSortEnd={this.onSortEnd}
        currentUser={this.props.currentUser}
        removeItem={this.removePostId}
        shouldCancelStart={this.shouldCancelStart}
      />
      <Components.PostsSearchAutoComplete
        clickAction={this.addPostId}
      />
    </div>
  }
};

(PostsListEditor as any).contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
};

// TODO: Does not work in nested contexts because it doesn't use the
// vulcan-forms APIs correctly.
const PostsListEditorComponent = registerComponent("PostsListEditor", PostsListEditor, {
  styles,
  hocs: [withUser]
});

declare global {
  interface ComponentTypes {
    PostsListEditor: typeof PostsListEditorComponent
  }
}
