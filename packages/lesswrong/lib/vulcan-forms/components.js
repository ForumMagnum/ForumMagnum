import { importComponent } from 'meteor/vulcan:lib';

importComponent("FieldErrors", () => require('../../components/vulcan-forms/FieldErrors'));
importComponent("FormErrors", () => require('../../components/vulcan-forms/FormErrors'));
importComponent("FormError", () => require('../../components/vulcan-forms/FormError'));
importComponent("FormComponent", () => require('../../components/vulcan-forms/FormComponent'));
importComponent("FormNestedArray", () => require('../../components/vulcan-forms/FormNestedArray'));
importComponent("FormNestedDivider", () => require('../../components/vulcan-forms/FormNestedDivider'));
importComponent("FormNestedFoot", () => require('../../components/vulcan-forms/FormNestedFoot'));
importComponent("FormNestedHead", () => require('../../components/vulcan-forms/FormNestedHead'));
importComponent("FormNestedObject", () => require('../../components/vulcan-forms/FormNestedObject'));
importComponent("FormNestedItem", () => require('../../components/vulcan-forms/FormNestedItem'));
importComponent("FormIntl", () => require('../../components/vulcan-forms/FormIntl'));
importComponent("FormGroup", () => require('../../components/vulcan-forms/FormGroup'));
importComponent("FormWrapper", () => require('../../components/vulcan-forms/FormWrapper'));
importComponent("Form", () => require('../../components/vulcan-forms/Form'));
