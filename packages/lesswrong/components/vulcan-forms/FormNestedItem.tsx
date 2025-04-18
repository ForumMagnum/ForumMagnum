import React from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import type { FormComponentOverridesType } from './propTypes';

const FormNestedItemLayout = ({ content, removeButton }: {
  content: React.ReactNode
  removeButton: React.ReactNode
}) => (
  <div className="form-nested-item">
    <div className="form-nested-item-inner">{content}</div>
    {removeButton && [
      <div key="remove-button" className="form-nested-item-remove">
        {removeButton}
      </div>,
      <div
        key="remove-button-overlay"
        className="form-nested-item-deleted-overlay"
      />
    ]}
  </div>
);
const FormNestedItemLayoutComponent = registerComponent('FormNestedItemLayout', FormNestedItemLayout);

const FormNestedItem = ({ nestedFields, name, path, removeItem, itemIndex, formComponents, hideRemove, ...props }: FormComponentWrapperProps<any> & {
  nestedFields: any
  name: string
  path: string
  removeItem: (i: string) => void
  itemIndex: number
  formComponents: FormComponentOverridesType
  hideRemove: boolean
}) => {
  const isArray = typeof itemIndex !== 'undefined';
  return (
    <Components.FormNestedItemLayout
      content={nestedFields.map((field: AnyBecauseTodo, i: number) => {
        return (
          <Components.FormComponent
            key={i}
            {...props}
            {...field}
            path={`${path}.${field.name}`}
            itemIndex={itemIndex}
          />
        );
      })}
      removeButton={
        isArray && !hideRemove && [
          <div key="remove-button" className="form-nested-item-remove">
            <button
              className="form-nested-button"
              tabIndex={-1}
              onClick={() => {
                removeItem(name);
              }}
            >
              <Components.IconRemove height={12} width={12} />
            </button>
          </div>,
          <div
            key="remove-button-overlay"
            className="form-nested-item-deleted-overlay"
          />
        ]
      }
    />
  );
};

const FormNestedItemComponent = registerComponent('FormNestedItem', FormNestedItem);

declare global {
  interface ComponentTypes {
    FormNestedItemLayout: typeof FormNestedItemLayoutComponent
    FormNestedItem: typeof FormNestedItemComponent
  }
}
