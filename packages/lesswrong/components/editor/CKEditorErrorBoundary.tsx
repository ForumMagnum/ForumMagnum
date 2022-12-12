import React, { Component, createContext } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import type { CKPostEditorProps } from './CKPostEditor';

interface ErrorState {
  error?: unknown;
}

interface CKEditorErrorBoundaryProps {
  handleError: (error: unknown) => void;
}

export class CKEditorErrorBoundary extends Component<CKEditorErrorBoundaryProps, ErrorState> {
  constructor(props: CKEditorErrorBoundaryProps) {
    console.log('in CKEditorErrorBoundary');
    super(props);
    this.state = {};
  }

  static getDerivedStateFromError(error: unknown) {
    console.log({ error }, 'in error boundary getDerivedStateFromError');
    return { error };
  }

  componentDidCatch(error: unknown) {
    console.error({ error }, 'in error boundary componentDidCatch');
    this.props.handleError(error);
    this.setState({ error });
  }

  render() {
    // const { CKPostEditor } = Components;
    // const { error } = this.state;

    // if (error) {
    //   console.log({ error }, 'rendering in CKEditorErrorBoundary');
    //   // this.props.handleError(error);
    //   return <>Error!</>;
    // }
    return this.props.children;
    // return (
    //   // <CKEditorErrorContext.Provider value={{ error }}>
    //     {this.props.children}
    //     {/* <CKPostEditor {...this.props} renderingError={error} /> */}
    //   // </CKEditorErrorContext.Provider>
    // );
  }
}

const CKEditorErrorBoundaryComponent = registerComponent('CKEditorErrorBoundary', CKEditorErrorBoundary);

declare global {
  interface ComponentTypes {
    CKEditorErrorBoundary: typeof CKEditorErrorBoundaryComponent
  }
}

