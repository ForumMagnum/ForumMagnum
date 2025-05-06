// @inheritedComponent FormGroup

import React from 'react';
import warning from 'warning';
import FormGroup from '../FormGroup';
import { StandardProps } from '..';
import { FormGroupClassKey, FormGroupProps } from '../FormGroup/FormGroup';

export interface RadioGroupProps
  extends StandardProps<FormGroupProps, RadioGroupClassKey, 'onChange'> {
  name?: string;
  onChange?: (event: React.ChangeEvent<{}>, value: string) => void;
  value?: string;
}

export type RadioGroupClassKey = FormGroupClassKey;

class RadioGroup extends React.Component<RadioGroupProps> {
  radios: AnyBecauseTodo[] = [];

  focus = () => {
    if (!this.radios || !this.radios.length) {
      return;
    }

    const focusRadios = this.radios.filter(n => !n.disabled);

    if (!focusRadios.length) {
      return;
    }

    const selectedRadio = focusRadios.find(n => n.checked);

    if (selectedRadio) {
      selectedRadio.focus();
      return;
    }

    focusRadios[0].focus();
  };

  handleRadioChange = (event: AnyBecauseTodo, checked: boolean) => {
    if (checked && this.props.onChange) {
      this.props.onChange(event, event.target.value);
    }
  };

  render() {
    const { children, name, value, onChange, ...other } = this.props;

    this.radios = [];

    return (
      <FormGroup role="radiogroup" {...other}>
        {React.Children.map(children, (child: AnyBecauseHard) => {
          if (!React.isValidElement(child)) {
            return null;
          }

          warning(
            child.type !== React.Fragment,
            [
              "Material-UI: the RadioGroup component doesn't accept a Fragment as a child.",
              'Consider providing an array instead.',
            ].join('\n'),
          );

          return React.cloneElement(child, {
            name,
            inputRef: (node: AnyBecauseTodo) => {
              if (node) {
                this.radios.push(node);
              }
            },
            checked: value === (child.props as AnyBecauseHard)?.value,
            onChange: (ev: AnyBecauseTodo, checked: boolean) => {
              (child as AnyBecauseHard).props?.onChange?.(ev, checked);
              this.handleRadioChange(ev, checked);
            }
          } as AnyBecauseHard);
        })}
      </FormGroup>
    );
  }
}

export default RadioGroup;
