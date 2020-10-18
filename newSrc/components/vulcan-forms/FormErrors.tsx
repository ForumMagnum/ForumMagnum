import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.errorStyle
  }
})

const FormErrors = ({ classes, errors }) => (
  <div className={classNames(classes.root, "form-errors")}>
    {!!errors.length && (
      <Components.Alert className="flash-message" variant="danger">
        <ul>
          {errors.map((error, index) => (
            <li key={index}>
              <Components.FormError error={error} errorContext="form" />
            </li>
          ))}
        </ul>
      </Components.Alert>
    )}
  </div>
);
const FormErrorsComponent = registerComponent('FormErrors', FormErrors, {styles});

declare global {
  interface ComponentTypes {
    FormErrors: typeof FormErrorsComponent
  }
}

// /*

//   Render errors

//   */
//  renderErrors = () => {
//   return (
//     <div className="form-errors">
//       {this.state.errors.map((error, index) => {
//         let message;

//         if (error.data && error.data.errors) {
//           // this error is a "multi-error" with multiple sub-errors

//           message = error.data.errors.map(error => {
//             return {
//               content: this.getErrorMessage(error),
//               data: error.data,
//             };
//           });
//         } else {
//           // this is a regular error

//           message = {
//             content:
//               error.message ||
//               this.context.intl.formatMessage({ id: error.id, defaultMessage: error.id }, error.data),
//           };
//         }

//         return <Components.FormFlash key={index} message={message} type="error" />;
//       })}
//     </div>
//   );
// };
