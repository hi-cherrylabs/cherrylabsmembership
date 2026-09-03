import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    (this as any).state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // eslint-disable-next-line no-console
    console.error('cherrylabs.inc crashed:', error, info);
  }

  render() {
    if ((this as any).state?.hasError) {
      return (
        <div className="w-full h-screen flex flex-col items-center justify-center gap-4 bg-[var(--bg-page)] px-8 text-center">
          <h1 className="text-2xl font-black text-[var(--text-90)]">Something went wrong</h1>
          <p className="text-sm font-semibold text-[var(--text-50)] max-w-sm">
            This screen hit an unexpected error. Try reloading — if it keeps happening, let us know via the suggestions inbox.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-[var(--invert-bg)] text-[var(--invert-text)] rounded-full font-bold text-sm"
          >
            Reload
          </button>
        </div>
      );
    }
    return (this as any).props.children;
  }
}
