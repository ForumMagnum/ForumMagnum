import { Components, registerComponent } from 'meteor/vulcan:core';
import { Link } from 'react-router';
import React, {Component } from 'react';

class Section extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  
  render() {
    if (this.state.error) {
      return <div className="errorText">Error rendering section: {this.state.error}</div>
    }
    
    let {contentStyle, title, titleWidth = 220, contentWidth = 715, titleLink, titleComponent, children} = this.props;
    
    return (
      <div className="section" style={{width: `${titleWidth+contentWidth+5}px`, display: 'flex'}}>
        <div className="section-title" style={{width: `${titleWidth}px`}}>
          <div className="section-title-top">
            {title && !titleLink && <h2>{title}</h2> }
            {title && titleLink && <Link to={titleLink}><h2>{title}</h2></Link> }
          </div>
          <div className="section-title-bottom">
            {titleComponent ? titleComponent : null}
          </div>
        </div>
        <div className="section-content" style={{width: `${contentWidth}px`, ...contentStyle}}>
          {children}
        </div>
      </div>
    )
  }
  
  componentDidCatch(error, info) {
    this.setState({error:error.toString()});
  }
}

registerComponent('Section', Section);
