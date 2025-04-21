import React from 'react';
import classnames from 'classnames';
import debounce from 'debounce'; // < 1kb payload overhead when lodash/debounce is > 3kb.
import EventListener from 'react-event-listener';
import { setRef } from '../utils/reactHelpers';
import { StandardProps } from '..';
import { defineStyles, withStyles } from '@/components/hooks/useStyles';

export interface TextareaProps
  extends StandardProps<
      React.TextareaHTMLAttributes<HTMLTextAreaElement>,
      TextareaClassKey,
      'rows'
    > {
  defaultValue?: any;
  disabled?: boolean;
  rows?: string | number;
  rowsMax?: string | number;
  textareaRef?: React.Ref<any> | React.RefObject<any>;
  value?: string;
}

export type TextareaClassKey = 'root' | 'shadow' | 'textarea';

const ROWS_HEIGHT = 19;

export const styles = defineStyles("MuiTextarea", theme => ({
  /* Styles applied to the root element. */
  root: {
    position: 'relative', // because the shadow has position: 'absolute',
    width: '100%',
  },
  textarea: {
    width: '100%',
    height: '100%',
    resize: 'none',
    font: 'inherit',
    padding: 0,
    cursor: 'inherit',
    boxSizing: 'border-box',
    lineHeight: 'inherit',
    border: 'none',
    outline: 'none',
    background: 'transparent',
  },
  shadow: {
    // Overflow also needed to here to remove the extra row
    // added to textareas in Firefox.
    overflow: 'hidden',
    // Visibility needed to hide the extra text area on ipads
    visibility: 'hidden',
    position: 'absolute',
    height: 'auto',
    whiteSpace: 'pre-wrap',
  },
}), {stylePriority: -10});

/**
 * @ignore - internal component.
 */
class Textarea extends React.Component<TextareaProps> {
  isControlled: boolean

  handleResize = debounce(() => {
    this.syncHeightWithShadow();
  }, 166); // Corresponds to 10 frames at 60 Hz.

  constructor(props: TextareaProps) {
    super(props);
    this.isControlled = props.value != null;
    // <Input> expects the components it renders to respond to 'value'
    // so that it can check whether they are filled.
    this.value = props.value || props.defaultValue || '';
    this.state = {
      height: Number(props.rows) * ROWS_HEIGHT,
    };
  }

  componentDidMount() {
    this.syncHeightWithShadow();
  }

  componentDidUpdate() {
    this.syncHeightWithShadow();
  }

  componentWillUnmount() {
    this.handleResize.clear();
  }

  handleRefInput = ref => {
    this.inputRef = ref;

    setRef(this.props.textareaRef, ref);
  };

  handleRefSinglelineShadow = ref => {
    this.singlelineShadowRef = ref;
  };

  handleRefShadow = ref => {
    this.shadowRef = ref;
  };

  handleChange = event => {
    this.value = event.target.value;

    if (!this.isControlled) {
      // The component is not controlled, we need to update the shallow value.
      this.shadowRef.value = this.value;
      this.syncHeightWithShadow();
    }

    if (this.props.onChange) {
      this.props.onChange(event);
    }
  };

  syncHeightWithShadow() {
    const props = this.props;

    // Guarding for **broken** shallow rendering method that call componentDidMount
    // but doesn't handle refs correctly.
    // To remove once the shallow rendering has been fixed.
    if (!this.shadowRef) {
      return;
    }

    if (this.isControlled) {
      // The component is controlled, we need to update the shallow value.
      this.shadowRef.value = props.value == null ? '' : String(props.value);
    }

    const lineHeight = this.singlelineShadowRef.scrollHeight;
    let newHeight = this.shadowRef.scrollHeight;

    // Guarding for jsdom, where scrollHeight isn't present.
    // See https://github.com/tmpvar/jsdom/issues/1013
    if (newHeight === undefined) {
      return;
    }

    if (Number(props.rowsMax) >= Number(props.rows)) {
      newHeight = Math.min(Number(props.rowsMax) * lineHeight, newHeight);
    }

    newHeight = Math.max(newHeight, lineHeight);

    // Need a large enough different to update the height.
    // This prevents infinite rendering loop.
    if (Math.abs(this.state.height - newHeight) > 1) {
      this.setState({
        height: newHeight,
      });
    }
  }

  render() {
    const {
      classes,
      className,
      defaultValue,
      onChange,
      rows,
      rowsMax,
      textareaRef,
      value,
      ...other
    } = this.props;

    return (
      <div className={classes.root}>
        <EventListener target="window" onResize={this.handleResize} />
        <textarea
          aria-hidden="true"
          className={classnames(classes.textarea, classes.shadow)}
          readOnly
          ref={this.handleRefSinglelineShadow}
          rows="1"
          tabIndex={-1}
          value=""
        />
        <textarea
          aria-hidden="true"
          className={classnames(classes.textarea, classes.shadow)}
          defaultValue={defaultValue}
          readOnly
          ref={this.handleRefShadow}
          rows={rows}
          tabIndex={-1}
          value={value}
        />
        <textarea
          rows={rows}
          className={classnames(classes.textarea, className)}
          defaultValue={defaultValue}
          value={value}
          onChange={this.handleChange}
          ref={this.handleRefInput}
          style={{ height: this.state.height }}
          {...other}
        />
      </div>
    );
  }
}

Textarea.defaultProps = {
  rows: 1,
};

export default withStyles(styles, Textarea);
