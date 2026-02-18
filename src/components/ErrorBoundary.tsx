'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

interface ErrorBoundaryProps {
  readonly children: ReactNode;
}

interface ErrorBoundaryState {
  readonly hasError: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6">{'\u2694\uFE0F'}</div>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: 'var(--color-accent-red)' }}
            >
              예상치 못한 오류
            </h2>
            <p
              className="mb-8 text-base"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              문제가 발생했습니다. 페이지를 새로고침해주세요.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--color-accent-gold)',
                color: '#000',
              }}
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
