import React, { PureComponent } from 'react';
import { Components } from 'meteor/vulcan:core';
import { hookToHoc } from '../../lib/hocUtils.js';

export const CommentBoxContext = React.createContext('commentBox');

export class CommentBoxManager extends PureComponent {
  state = {
    currentDialog: null,
    componentProps: null
  };

  close = () => {
    this.setState({
      componentName: null,
      componentProps: null
    });
  }

  render() {
    const { children } = this.props;
    const { componentName } = this.state;
    const CommentBoxComponent = componentName ? Components[componentName] : null;

    return (
      <CommentBoxContext.Provider value={{
        openCommentBox: ({componentName, componentProps}) => this.setState({
          componentName: componentName,
          componentProps: componentProps
        }),
        close: this.close
      }}>
        {children}

        {this.state.componentName &&
          <CommentBoxComponent
            {...this.state.componentProps}
            onClose={this.close}
          />
        }
      </CommentBoxContext.Provider>
    );
  }
}

export const useCommentBox = () => React.useContext(CommentBoxContext);
export const withCommentBox = hookToHoc(useCommentBox);
export default withCommentBox;
