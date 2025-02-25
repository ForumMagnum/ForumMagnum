import PropTypes, { configStyleValidator, styleValidator } from './PropTypes'
import renderEmail from './renderEmail'

const DEV = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'

configStyleValidator({
  warn: DEV,
})

export default {
  PropTypes,
  configStyleValidator,
  renderEmail,
  styleValidator,
}
