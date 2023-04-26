import { importComponent } from '../../lib/vulcan-lib';

importComponent("FieldErrors", () => require('./FieldErrors'));
importComponent("FormErrors", () => require('./FormErrors'));
importComponent("FormError", () => require('./FormError'));
importComponent("FormComponent", () => require('./FormComponent'));
importComponent(["FormNestedArrayLayout", "FormNestedArray", "IconRemove"], () => require('./FormNestedArray'));
importComponent("FormNestedDivider", () => require('./FormNestedDivider'));
importComponent("FormNestedFoot", () => require('./FormNestedFoot'));
importComponent("FormNestedHead", () => require('./FormNestedHead'));
importComponent(["FormNestedObjectLayout", "FormNestedObject"], () => require('./FormNestedObject'));
importComponent(["FormNestedItemLayout", "FormNestedItem"], () => require('./FormNestedItem'));
importComponent(["FormGroupHeader", "FormGroupLayout", "FormGroup", "IconRight", "IconDown"], () => require('./FormGroup'));
importComponent("FormWrapper", () => require('./FormWrapper'));
