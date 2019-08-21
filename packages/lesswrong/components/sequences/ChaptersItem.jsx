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
  posts: {
    [theme.breakpoints.down('sm')]: {
      paddingLeft: 8,
      paddingRight: 8
    }
  }
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

  render() {
    const { chapter, classes, canEdit } = this.props;
    const { ChaptersEditForm, SingleColumnSection, SectionTitle, SectionFooter, 
      SectionButton, SequencesPostsList } = Components
    const { html = "" } = chapter.contents
    if (this.state.edit) return ( 
      <ChaptersEditForm
        documentId={chapter._id}
        successCallback={this.showChapter}
        cancelCallback={this.showChapter} />
    )
    const editButton = <SectionButton><a onClick={this.showEdit}>Add/Remove Posts</a></SectionButton> 

    return (
      <SingleColumnSection>
        {chapter.title && <SectionTitle title={chapter.title}>
          {canEdit && editButton}
        </SectionTitle>}
        {html && <div className={classes.description}>
          <div dangerouslySetInnerHTML={{__html: html}}/> 
        </div>}
        <div className={classes.posts}>
          <SequencesPostsList posts={chapter.posts} chapter={chapter} />
        </div>
        {!chapter.title && canEdit && <SectionFooter>{editButton}</SectionFooter>}
      </SingleColumnSection>
    )
  }
}

registerComponent('ChaptersItem', ChaptersItem, withStyles(styles, {name: "ChaptersItem"}))
