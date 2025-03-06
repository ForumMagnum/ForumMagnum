import FormControl from 'react-bootstrap/FormControl';
import { registerComponent } from '../../../lib/vulcan-lib/components';

const FormControlComponent = registerComponent('FormControl', FormControl);

declare global {
  interface ComponentTypes {
    FormControl: typeof FormControlComponent
  }
}

export default FormControlComponent;

