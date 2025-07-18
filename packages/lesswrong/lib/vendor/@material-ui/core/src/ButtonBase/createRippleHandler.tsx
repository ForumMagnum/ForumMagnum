function createRippleHandler(instance: AnyBecauseTodo, eventName: AnyBecauseTodo, action: AnyBecauseTodo, cb?: AnyBecauseTodo) {
  return function handleEvent(event: AnyBecauseTodo) {
    if (cb) {
      cb.call(instance, event);
    }

    let ignore = false;

    // Ignore events that have been `event.preventDefault()` marked.
    if (event.defaultPrevented) {
      ignore = true;
    }

    if (instance.props.disableTouchRipple && eventName !== 'Blur') {
      ignore = true;
    }

    if (!ignore && instance.ripple) {
      instance.ripple[action](event);
    }

    if (typeof instance.props[`on${eventName}`] === 'function') {
      instance.props[`on${eventName}`](event);
    }

    return true;
  };
}

export default createRippleHandler;
