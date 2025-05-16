import React from 'react';
import classNames from 'classnames';
import keycode from 'keycode';
import warning from 'warning';
import { isFilled } from '../InputBase/utils';
import { setRef } from '../utils/reactHelpers';
import { Menu } from '@/components/widgets/Menu';
import ArrowDropDownIcon from '../internal/svg-icons/ArrowDropDown';
import omit from 'lodash/omit';

export interface SelectInputProps {
  autoFocus?: boolean;
  disabled?: boolean;
  inputRef?: (
    ref: HTMLSelectElement | { node: HTMLInputElement; value: SelectInputProps['value'] },
  ) => void;
  multiple: boolean;
  name?: string;
  type?: string
  native: boolean;
  displayEmpty?: boolean
  onBlur?: React.FocusEventHandler<any>;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>, child: React.ReactNode) => void;
  onClose?: (event: React.ChangeEvent<{}>) => void;
  onFocus?: React.FocusEventHandler<any>;
  onOpen?: (event: React.ChangeEvent<{}>) => void;
  open?: boolean;
  readOnly?: boolean;
  renderValue?: (value: SelectInputProps['value']) => React.ReactNode;
  SelectDisplayProps?: React.HTMLAttributes<HTMLDivElement>;
  tabIndex?: number;
  value?: string | number | Array<string | number | boolean>;
  variant?: 'standard' | 'outlined' | 'filled';
  className?: string
  classes?: AnyBecauseTodo
  required?: boolean
  children?: React.ReactNode
}

type SelectInputState = {
  menuMinWidth: number|null,
  open: boolean,
}

class SelectInput extends React.Component<SelectInputProps, SelectInputState> {
  ignoreNextBlur = false;
  isOpenControlled = false
  displayRef: AnyBecauseTodo

  constructor(props: SelectInputProps) {
    super(props);
    this.isOpenControlled = props.open !== undefined;
    this.state = {
      menuMinWidth: null,
      open: false,
    };
  }

  componentDidMount() {
    if (this.isOpenControlled && this.props.open) {
      // Focus the display node so the focus is restored on this element once
      // the menu is closed.
      this.displayRef.focus();
      // Rerender with the resolve `displayRef` reference.
      this.forceUpdate();
    }

    if (this.props.autoFocus) {
      this.displayRef.focus();
    }
  }

  update = ({ event, open }: AnyBecauseTodo) => {
    if (this.isOpenControlled) {
      if (open) {
        this.props.onOpen?.(event);
      } else {
        this.props.onClose?.(event);
      }
      return;
    }

    this.setState({
      // Perfom the layout computation outside of the render method.
      menuMinWidth: null,
      open,
    });
  };

  handleClick = (event: AnyBecauseTodo) => {
    // Opening the menu is going to blur the. It will be focused back when closed.
    this.ignoreNextBlur = true;
    this.update({
      open: true,
      event,
    });
  };

  handleClose = (event: AnyBecauseTodo) => {
    this.update({
      open: false,
      event,
    });
  };

  handleItemClick = (child: AnyBecauseTodo) => (event: AnyBecauseTodo) => {
    if (!this.props.multiple) {
      this.update({
        open: false,
        event,
      });
    }

    const { onChange, name } = this.props;

    if (onChange) {
      let value;

      if (this.props.multiple) {
        value = Array.isArray(this.props.value) ? [...this.props.value] : [];
        const itemIndex = value.indexOf(child.props.value);
        if (itemIndex === -1) {
          value.push(child.props.value);
        } else {
          value.splice(itemIndex, 1);
        }
      } else {
        value = child.props.value;
      }

      event.persist();
      event.target = { value, name };
      onChange(event, child);
    }
  };

  handleBlur = (event: AnyBecauseTodo) => {
    if (this.ignoreNextBlur === true) {
      // The parent components are relying on the bubbling of the event.
      event.stopPropagation();
      this.ignoreNextBlur = false;
      return;
    }

    if (this.props.onBlur) {
      const { value, name } = this.props;
      event.persist();
      event.target = { value, name };
      this.props.onBlur(event);
    }
  };

  handleKeyDown = (event: AnyBecauseTodo) => {
    if (this.props.readOnly) {
      return;
    }

    if (['space', 'up', 'down'].indexOf(keycode(event)) !== -1) {
      event.preventDefault();
      // Opening the menu is going to blur the. It will be focused back when closed.
      this.ignoreNextBlur = true;
      this.update({
        open: true,
        event,
      });
    }
  };

  handleDisplayRef = (ref: AnyBecauseTodo) => {
    this.displayRef = ref;
  };

  handleInputRef = (ref: AnyBecauseTodo) => {
    const { inputRef } = this.props;

    if (!inputRef) {
      return;
    }

    const nodeProxy = {
      node: ref,
      // By pass the native input as we expose a rich object (array).
      value: this.props.value,
    };

    setRef(inputRef, nodeProxy);
  };

  render() {
    const {
      children,
      classes,
      className,
      disabled,
      displayEmpty,
      inputRef,
      multiple,
      name,
      onBlur,
      onChange,
      onClose,
      onFocus,
      onOpen,
      open: openProp,
      readOnly,
      renderValue,
      required,
      SelectDisplayProps,
      tabIndex: tabIndexProp,
      type = 'hidden',
      value,
      variant,
      ...other
    } = this.props;
    const open = this.isOpenControlled && this.displayRef ? openProp : this.state.open;

    const otherWithoutAriaInvalid = omit(other, ['aria-invalid']);

    let display;
    let displaySingle = '';
    const displayMultiple: AnyBecauseTodo[] = [];
    let computeDisplay = false;

    // No need to display any value if the field is empty.
    if (isFilled(this.props) || displayEmpty) {
      if (renderValue) {
        display = renderValue(value);
      } else {
        computeDisplay = true;
      }
    }

    const items = React.Children.map(children, child => {
      if (!React.isValidElement(child)) {
        return null;
      }

      warning(
        child.type !== React.Fragment,
        [
          "Material-UI: the Select component doesn't accept a Fragment as a child.",
          'Consider providing an array instead.',
        ].join('\n'),
      );

      let selected;

      if (multiple) {
        if (!Array.isArray(value)) {
          throw new Error(
            'Material-UI: the `value` property must be an array ' +
              'when using the `Select` component with `multiple`.',
          );
        }

        selected = value.indexOf((child.props as AnyBecauseTodo).value) !== -1;
        if (selected && computeDisplay) {
          displayMultiple.push((child.props as AnyBecauseTodo).children);
        }
      } else {
        selected = value === (child.props as AnyBecauseTodo).value;
        if (selected && computeDisplay) {
          displaySingle = (child.props as AnyBecauseTodo).children;
        }
      }

      return React.cloneElement(child, {
        onClick: this.handleItemClick(child),
        role: 'option',
        selected,
        value: undefined, // The value is most likely not a valid HTML attribute.
        'data-value': (child.props as AnyBecauseTodo).value, // Instead, we provide it as a data attribute.
      } as AnyBecauseTodo);
    });

    if (computeDisplay) {
      display = multiple ? displayMultiple.join(', ') : displaySingle;
    }

    // Avoid performing a layout computation in the render method.
    let menuMinWidth = this.state.menuMinWidth;

    if (this.isOpenControlled && this.displayRef) {
      menuMinWidth = this.displayRef.clientWidth;
    }

    let tabIndex;
    if (typeof tabIndexProp !== 'undefined') {
      tabIndex = tabIndexProp;
    } else {
      tabIndex = disabled ? null : 0;
    }

    return (
      <div className={classes.root}>
        <div
          className={classNames(
            classes.select,
            classes.selectMenu,
            {
              [classes.disabled]: disabled,
              [classes.filled]: variant === 'filled',
              [classes.outlined]: variant === 'outlined',
            },
            className,
          )}
          ref={this.handleDisplayRef}
          data-mui-test="SelectDisplay"
          aria-pressed={open ? 'true' : 'false'}
          tabIndex={tabIndex ?? undefined}
          role="button"
          aria-owns={open ? `menu-${name || ''}` : undefined}
          aria-haspopup="true"
          onKeyDown={this.handleKeyDown}
          onBlur={this.handleBlur}
          onClick={disabled || readOnly ? undefined : this.handleClick}
          onFocus={onFocus}
          {...SelectDisplayProps}
        >
          {/* So the vertical align positioning algorithm quicks in. */}
          {/* eslint-disable-next-line react/no-danger */}
          {display || <span dangerouslySetInnerHTML={{ __html: '&#8203;' }} />}
        </div>
        <input
          value={Array.isArray(value) ? value.join(',') : value}
          name={name}
          ref={this.handleInputRef}
          type={type}
          {...otherWithoutAriaInvalid}
        />
        <ArrowDropDownIcon className={classes.icon} />
        <Menu
          anchorEl={this.displayRef}
          open={open ?? false}
          onClose={this.handleClose}
          minWidth={menuMinWidth ?? undefined}
        >
          {items}
        </Menu>
      </div>
    );
  }
}

export default SelectInput;
