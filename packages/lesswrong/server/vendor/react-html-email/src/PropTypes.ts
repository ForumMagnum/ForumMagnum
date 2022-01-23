import PropTypes from 'prop-types'
import StyleValidator from './StyleValidator'

export const styleValidator = new StyleValidator()

export function configStyleValidator(config: any) {
  styleValidator.setConfig(config)
}

export default {
  style(props: any, propName: any, componentName: any, ...rest: any) {
    if (props[propName] == null) {
      return undefined
    }
    const objErr = (PropTypes.object as any)(props, propName, componentName, ...rest)
    if (objErr) {
      return objErr
    }
    return styleValidator.validate(props[propName], componentName)
  },
}
