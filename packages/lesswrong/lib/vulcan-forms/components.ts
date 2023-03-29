import { importComponent } from '../vulcan-lib';

importComponent("FieldErrors", () => require('../../components/vulcan-forms/FieldErrors'));
importComponent("FormErrors", () => require('../../components/vulcan-forms/FormErrors'));
importComponent("FormError", () => require('../../components/vulcan-forms/FormError'));
importComponent("FormComponent", () => require('../../components/vulcan-forms/FormComponent'));
importComponent(["FormNestedArrayLayout", "FormNestedArray", "IconRemove"], () => require('../../components/vulcan-forms/FormNestedArray'));
importComponent("FormNestedDivider", () => require('../../components/vulcan-forms/FormNestedDivider'));
importComponent("FormNestedFoot", () => require('../../components/vulcan-forms/FormNestedFoot'));
importComponent("FormNestedHead", () => require('../../components/vulcan-forms/FormNestedHead'));
importComponent(["FormNestedObjectLayout", "FormNestedObject"], () => require('../../components/vulcan-forms/FormNestedObject'));
importComponent(["FormNestedItemLayout", "FormNestedItem"], () => require('../../components/vulcan-forms/FormNestedItem'));
importComponent(["FormGroupHeader", "FormGroupLayout", "FormGroup", "IconRight", "IconDown"], () => require('../../components/vulcan-forms/FormGroup'));
importComponent("FormWrapper", () => require('../../components/vulcan-forms/FormWrapper'));
