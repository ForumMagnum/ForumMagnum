import { AgentBlockComponent } from './AgentBlockComponent';
import { setAgentBlockComponent } from './agentBlockComponentRegistry';

// Side-effect module: installs the AgentBlock React component into the
// late-bound registry (see agentBlockComponentRegistry.ts for why the node
// can't import the component directly). Imported by the document-editor
// surface before any AgentBlockNode renders.
setAgentBlockComponent(AgentBlockComponent);
