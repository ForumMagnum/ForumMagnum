import { Components, registerComponent } from 'meteor/vulcan:core';
import { Link } from 'react-router';
import React from 'react';

const Section = ({contentStyle, title, titleWidth = 220, contentWidth = 715, titleLink, titleComponent, children}) => {

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
      <div className="section-content" style={{width: `${contentWidth}`, ...contentStyle}}>
        {children}
      </div>
    </div>
  )
};

registerComponent('Section', Section);
