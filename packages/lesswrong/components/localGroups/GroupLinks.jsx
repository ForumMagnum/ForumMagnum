import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, Components } from 'meteor/vulcan:core';
import LinkIcon from '@material-ui/icons/Link';
import SvgIcon from '@material-ui/core/SvgIcon';
import IconButton from 'material-ui/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import FontIcon from 'material-ui/FontIcon';


const FacebookIcon = (props) => <SvgIcon viewBox="0 0 155.139 155.139" {...props}>
  <path id="f_1_" d="M89.584,155.139V84.378h23.742l3.562-27.585H89.584V39.184
  c0-7.984,2.208-13.425,13.67-13.425l14.595-0.006V1.08C115.325,0.752,106.661,0,96.577,0C75.52,0,61.104,12.853,61.104,36.452 v20.341H37.29v27.585h23.814v70.761H89.584z"/>
</SvgIcon>

const GroupTypeIcon = (props) => <FontIcon style={{fontSize: '14px'}}>
  {props.type}
</FontIcon>

const buttonStyles = {
  padding: '0px',
  width: '18px',
  height: '18px'
}

const groupTypeStyles = {
  padding: '5px',
  width: 'initial',
  height: '20px',
}


class GroupLinks extends PureComponent {
  render() {
    const document = this.props.document;
    return(
      <div className="group-links">
        {document.types && document.types.map(type => {
          return (
            <Tooltip
              title="Group Type"
              placement="top-end"
              key={type}
            >
              <IconButton style={groupTypeStyles}>
                <GroupTypeIcon type={type}/>
              </IconButton>
            </Tooltip>
          )
        })}
        {document.facebookLink
          && <Tooltip
            title="Facebook Group"
            placement="top-end"
          >
            <a href={document.facebookLink}><IconButton style={buttonStyles}>
              <FacebookIcon className="group-links-facebook-icon"/>
            </IconButton></a>
          </Tooltip>}
        {document.website
          && <Tooltip
            title="Group Website"
            placement="top-end"
          >
            <a href={document.website}><IconButton style={buttonStyles}>
              <LinkIcon className="group-links-link-icon"/>
            </IconButton></a>
          </Tooltip>}
      </div>
    )
  }
}

registerComponent("GroupLinks", GroupLinks);
