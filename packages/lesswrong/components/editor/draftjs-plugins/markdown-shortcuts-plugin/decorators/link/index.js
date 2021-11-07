import createLinkStrategy from './linkStrategy';
import Link from '../../components/Link';

const createLinkDecorator = (config, store) => ({
  strategy: createLinkStrategy(config, store),
  component: Link,
});

export default createLinkDecorator;
