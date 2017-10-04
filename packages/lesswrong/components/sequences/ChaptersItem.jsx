import React, { PropTypes, Component } from 'react';
import { registerComponent, Components, getDynamicComponent } from 'meteor/vulcan:core';
import { editorHasContent } from '../../lib/modules/utils'

class ChaptersItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      edit: false,
    }
  }

  showEdit = () => {
    this.setState({edit: true})
  }

  showChapter = () => {
    this.setState({edit: false})
  }

  renderTitleComponent = (chapter, canEdit) => <div>
    {chapter.subtitle ?   <div className="chapters-item-subtitle">
      {chapter.subtitle}
    </div> : null}
    {canEdit ? <a onTouchTap={this.showEdit}>edit</a> : null}
  </div>

  render() {
    const chapter = this.props.chapter;
    // const ContentRenderer = (props) => getDynamicComponent(import('../asyns/ContentRenderer.jsx'), props);
    if (this.state.edit) {
      return <Components.ChaptersEditForm
        documentId={chapter._id}
        successCallback={this.showChapter}
        cancelCallback={this.showChapter} />
    } else {
      return <div className="chapters-item">
        <Components.Section title={chapter.title}
          titleComponent={this.renderTitleComponent(chapter, this.props.canEdit)}
        >
          {chapter.htmlDescription && <div className="content-body-html" dangerouslySetInnerHTML={chapter.htmlDescription}></div>}
          {/* {editorHasContent(chapter.description) ? <div className="chapters-item-description">
            <ContentRenderer state={chapter.description} /> //Commented out for performance reasons
          </div> : null} */}

          <div className="chapters-item-posts">
            <Components.SequencesPostsList posts={chapter.posts} chapter={chapter} />
          </div>
        </Components.Section>
      </div>
    }
  }
}

registerComponent('ChaptersItem', ChaptersItem)
