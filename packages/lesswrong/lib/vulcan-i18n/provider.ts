import { Component } from 'react';
import { getString } from '../vulcan-lib';
import { camelToSpaces } from '../vulcan-lib/utils';
import { intlShape } from './shape';

export default class IntlProvider extends Component<any> {
  formatMessage = ({ id, defaultMessage }: { id: string, defaultMessage?: string }, values: AnyBecauseTodo) => {
    return getString({ id, defaultMessage, values, locale: this.props.locale });
  };

  /**
   * formatLabel - Get a label for a field, for a given collection, in the current language. The evaluation is as follows : i18n(collectionName.fieldName) > i18n(global.fieldName) > i18n(fieldName) > schema.fieldName.label > fieldName
   *
   * @param  {object} params
   * @param  {string} params.fieldName          The name of the field to evaluate (required)
   * @param  {string} params.collectionName     The name of the collection the field belongs to
   * @param  {object} params.schema             The schema of the collection
   * @param  {object} values                     The values to pass to format the i18n string
   * @return {string}                            The translated label
   */

  formatLabel = ({ fieldName, collectionName, schema }: AnyBecauseTodo, values: AnyBecauseTodo) => {
    if (!fieldName) {
      throw new Error('fieldName option passed to formatLabel cannot be empty or undefined');
    }
    const defaultMessage = '|*|*|';
    // Get the intl label
    let intlLabel = defaultMessage;
    // try collectionName.fieldName as intl id
    if (collectionName) {
      intlLabel = this.formatMessage(
        { id: `${collectionName.toLowerCase()}.${fieldName}`, defaultMessage },
        values
      );
    }
    // try global.fieldName then just fieldName as intl id
    if (intlLabel === defaultMessage) {
      intlLabel = this.formatMessage({ id: `global.${fieldName}`, defaultMessage }, values);
      if (intlLabel === defaultMessage) {
        intlLabel = this.formatMessage({ id: fieldName }, values);
      }
    }
    if (intlLabel) {
      return intlLabel;
    }

    // define the schemaLabel. If the schema has been initialized with SimpleSchema, the label should be here even if it has not been declared https://github.com/aldeed/simple-schema-js#label
    let schemaLabel = schema && schema[fieldName] ? schema[fieldName].label : null;
    return schemaLabel || camelToSpaces(fieldName);
  };

  formatStuff = (something: AnyBecauseTodo) => {
    return something;
  };

  getChildContext() {
    return {
      intl: {
        formatDate: this.formatStuff,
        formatTime: this.formatStuff,
        formatRelative: this.formatStuff,
        formatNumber: this.formatStuff,
        formatPlural: this.formatStuff,
        formatMessage: this.formatMessage,
        formatLabel: this.formatLabel,
        formatHTMLMessage: this.formatStuff,
        now: this.formatStuff,
        locale: this.props.locale,
      },
    };
  }

  render() {
    return this.props.children;
  }
}

(IntlProvider as any).childContextTypes = {
  intl: intlShape,
};
