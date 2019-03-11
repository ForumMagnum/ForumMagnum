import React, { Component } from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  description: {
    marginLeft: 10,
    fontSize: 20,
    lineHeight: 1.25,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 1.1,
    fontStyle: "italic",
    marginTop: 20,
  },
});

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

  renderTitleComponent = (chapter, canEdit) => {
    const { classes } = this.props;
    return <div>
      {chapter.subtitle ? <div className={classes.subtitle}>
        {chapter.subtitle}
      </div> : null}
      {canEdit && <Components.SectionSubtitle><a onClick={this.showEdit}>Add/Remove Posts</a></Components.SectionSubtitle>}
    </div>
  }

  render() {
    const { chapter, classes } = this.props;
    const { html = "" } = chapter.contents
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
          {html && <div className={classes.description}>
            <div className="content-body" dangerouslySetInnerHTML={{__html: html}}/> 
          </div>}
          <div className="chapters-item-posts">
            <Components.SequencesPostsList posts={chapter.posts} chapter={chapter} />
          </div>
        </Components.Section>
      </div>
    }
  }
}

registerComponent('ChaptersItem', ChaptersItem, withStyles(styles, {name: "ChaptersItem"}))
