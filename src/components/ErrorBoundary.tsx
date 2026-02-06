import { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <p className="text-red-400 text-sm font-medium mb-2">Something went wrong</p>
            <p className="text-xs text-muted mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-700 text-zinc-100 hover:bg-zinc-600 transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
