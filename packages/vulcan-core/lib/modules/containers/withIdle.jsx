import { connect } from 'react-redux'
import { createConnector } from 'react-redux-idle-monitor'

// HOC that passes down the following properties to a component (implementation from )

//idleStatus: PropTypes.string.isRequired       // 'ACTIVE' if user is active or one of your other configured idle states.
//isIdle: PropTypes.bool.isRequired             // false if user is active or idle if user is in one of your idle states.
//isPaused: PropTypes.bool.isRequired           // true if idle detection has been paused.
//isDetectionRunning: PropTypes.bool.isRequired // true if redux idle middleware is currently monitoring user mouse / keyboard activity.
//lastActive: PropTypes.number.isRequired       // the last time that the user was active (when detection is running).
//lastEvent: PropTypes.object.isRequired        // the last mouse event coordinates that were triggered (when detection is running).

const withIdle = createConnector({ connect })
export default withIdle;
