// Temporary file to ignore TypeScript warnings during development
// This should be removed once all issues are properly fixed

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {};