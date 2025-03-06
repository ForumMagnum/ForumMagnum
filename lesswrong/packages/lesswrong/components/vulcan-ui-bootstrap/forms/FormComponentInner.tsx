import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { instantiateComponent, registerComponent } from '../../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { HIGHLIGHT_DURATION } from '../../comments/CommentFrame';
import { withLocation } from '../../../lib/routeUtil';

const styles = (theme: ThemeType) => ({
  formComponentClear: {
    "& span": {
      position: "relative",
      top: 20,
      padding: 10,
    },
  },
  '@keyframes higlight-animation': {
    from: {
      // In most cases it would look better with a border. But because this has to support so many different components, it's hard to know what the border should be, so instead just use a background color.
      backgroundColor: theme.palette.panelBackground.commentHighlightAnimation,
      borderRadius: 5,
    },
    to: {
      backgroundColor: "none",
      borderRadius: 5,
    }
  },
  highlightAnimation: {
    animation: `higlight-animation ${HIGHLIGHT_DURATION}s ease-in-out 0s;`
  },
});

class FormComponentInner extends PureComponent<any, {highlight: boolean}> {
  scrollRef: React.RefObject<HTMLDivElement>;

  constructor(props: AnyBecauseTodo) {
    super(props);

    this.state = {highlight: false};
    this.scrollRef = React.createRef<HTMLDivElement>()
  }

  componentDidMount(): void {
    // If highlightField is set to this field, scroll it into view and highlight it
    const { query } = this.props.location;
    const { name } = this.props;

    // NOTE: If you are grepping for highlightField because you tried it and it didn't work, it's possible that
    // this is because the field is of type FormNestedArray or FormNestedObject. Currently these fields don't
    // support highlighting (see packages/lesswrong/components/vulcan-forms/FormComponent.tsx for where these fields are rendered)
    if (name && name === query?.highlightField) {
      this.scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      this.setState({highlight: true});
      setTimeout(() => {
        this.setState({highlight: false});
      }, HIGHLIGHT_DURATION * 1000);
    }
  }

  renderClear = () => {
    const { classes } = this.props;
    if (
      ['datetime', 'time', 'select', 'radiogroup', 'SelectLocalgroup'].includes(this.props.input) &&
      !this.props.hideClear
    ) {
      return (
        <a
          className={classes.formComponentClear}
          title="Clear field"
          onClick={this.props.clearField}
        >
          <span>✕</span>
        </a>
      );
    }
  };

  getProperties = () => {
    const { name, path, options, label, onChange, value, disabled, inputType } = this.props;

    // these properties are whitelisted so that they can be safely passed to the actual form input
    // and avoid https://facebook.github.io/react/warnings/unknown-prop.html warnings
    const inputProperties = {
      name,
      path,
      options,
      label,
      onChange: (event: AnyBecauseTodo) => {
        // FormComponent's handleChange expects value as argument; look in target.checked or target.value
        const inputValue = inputType === 'checkbox' ? event.target.checked : event.target.value;
        onChange(inputValue);
      },
      value,
      disabled,
      ...this.props.inputProperties,
    };

    return {
      ...this.props,
      inputProperties,
    };
  };

  render() {
    const {
      inputClassName,
      name,
      input,
      beforeComponent,
      afterComponent,
      errors,
      showCharsRemaining,
      charsRemaining,
      formComponents,
      classes,
    } = this.props;

    const FormComponents = formComponents;

    const hasErrors = errors && errors.length;

    const inputName = typeof input === 'function' ? input.name : input;
    const inputClass = classNames(
      'form-input',
      inputClassName,
      `input-${name}`,
      `form-component-${inputName || 'default'}`,
      { 'input-error': hasErrors }
    );
    const properties = this.getProperties();

    const FormInput = this.props.formInput;

    return (
      <div className={classNames(inputClass, {[classes.highlightAnimation]: this.state.highlight})} ref={this.scrollRef}>
        {instantiateComponent(beforeComponent, properties)}
        <FormInput {...properties}/>
        {hasErrors ? <FormComponents.FieldErrors errors={errors} /> : null}
        {this.renderClear()}
        {showCharsRemaining && (
          <div className={classNames('form-control-limit', { danger: charsRemaining < 10 })}>{charsRemaining}</div>
        )}
        {instantiateComponent(afterComponent, properties)}
      </div>
    );
  }
}

(FormComponentInner as any).propTypes = {
  inputClassName: PropTypes.string,
  name: PropTypes.string.isRequired,
  input: PropTypes.any,
  beforeComponent: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  afterComponent: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  clearField: PropTypes.func.isRequired,
  errors: PropTypes.array.isRequired,
  help: PropTypes.node,
  onChange: PropTypes.func.isRequired,
  showCharsRemaining: PropTypes.bool.isRequired,
  charsRemaining: PropTypes.number,
  charsCount: PropTypes.number,
  charsMax: PropTypes.number,
  inputComponent: PropTypes.func,
  classes: PropTypes.any,
};

const FormComponentInnerComponent = registerComponent('FormComponentInner', FormComponentInner, {styles, hocs: [withLocation]});

declare global {
  interface ComponentTypes {
    FormComponentInner: typeof FormComponentInnerComponent
  }
}

export default FormComponentInnerComponent;
