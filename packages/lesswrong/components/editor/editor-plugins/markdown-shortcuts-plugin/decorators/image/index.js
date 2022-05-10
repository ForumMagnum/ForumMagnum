import createImageStrategy from './imageStrategy';
import Image from '../../components/Image';

const createImageDecorator = (config, store) => ({
  strategy: createImageStrategy(config, store),
  component: Image,
});

export default createImageDecorator;
