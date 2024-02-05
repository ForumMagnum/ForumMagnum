import React from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, mergeWithComponents } from '../../lib/vulcan-lib';

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

const FormNestedItem = ({ nestedFields, name, path, removeItem, itemIndex, formComponents, hideRemove, ...props }: FormComponentProps<any> & {
  nestedFields: any
  name: string
  path: string
  removeItem: (i: string) => void
  itemIndex: number
  formComponents: ComponentTypes
  hideRemove: boolean
}, { errors }: {
  errors: any[]
}) => {
  const FormComponents = mergeWithComponents(formComponents);
  const isArray = typeof itemIndex !== 'undefined';
  return (
    <FormComponents.FormNestedItemLayout
      content={nestedFields.map((field: AnyBecauseTodo, i: number) => {
        return (
          <FormComponents.FormComponent
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
            <Components.Button
              className="form-nested-button"
              variant="danger"
              size="small"
              iconButton
              tabIndex="-1"
              onClick={() => {
                removeItem(name);
              }}
            >
              <Components.IconRemove height={12} width={12} />
            </Components.Button>
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

FormNestedItem.contextTypes = {
  errors: PropTypes.array
};

const FormNestedItemComponent = registerComponent('FormNestedItem', FormNestedItem);

declare global {
  interface ComponentTypes {
    FormNestedItemLayout: typeof FormNestedItemLayoutComponent
    FormNestedItem: typeof FormNestedItemComponent
  }
}
