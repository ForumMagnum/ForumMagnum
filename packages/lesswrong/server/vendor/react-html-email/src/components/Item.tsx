import React from 'react'
import PropTypes from 'prop-types'
import EmailPropTypes from '../PropTypes'
import includeDataProps from '../includeDataProps'

export default function Item(props: any) {
  // Bypass type system because it doesn't know that "valign" and "bgcolor" are real
  // props (in HTML5, they wouldn't be)
  const extraProps: AnyBecauseTodo = {
    valign: props.valign,
    bgcolor: props.bgcolor,
  };
  return (
    <tr>
      <td
        {...includeDataProps(props)}
        className={props.className}
        align={props.align}
        {...extraProps}
        style={props.style}
      >
        {props.children}
      </td>
    </tr>
  )
}

Item.propTypes = {
  className: PropTypes.string,
  bgcolor: PropTypes.string,
  align: PropTypes.oneOf(['left', 'center', 'right']),
  valign: PropTypes.oneOf(['top', 'middle', 'bottom']),
  style: EmailPropTypes.style,
  children: PropTypes.node,
}

Item.defaultProps = {
  className: undefined,
  bgcolor: undefined,
  align: undefined,
  valign: undefined,
  style: undefined,
  children: undefined,
}
