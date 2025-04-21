function requirePropFactory(componentNameInError) {
  /* istanbul ignore if */
  if (process.env.NODE_ENV === 'production') {
    return () => null;
  }

  const requireProp = requiredProp => (props, propName, componentName, location, propFullName) => {
    const propFullNameSafe = propFullName || propName;

    if (typeof props[propName] !== 'undefined' && !props[requiredProp]) {
      return new Error(
        `The property \`${propFullNameSafe}\` of ` +
          `\`${componentNameInError}\` must be used on \`${requiredProp}\`.`,
      );
    }

    return null;
  };
  return requireProp;
}

export default requirePropFactory;
