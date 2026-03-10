// components/ui/ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { captureException } from '../../services/monitoring';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  context?: string;
  onGoBack?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  // Explicit declarations so TypeScript resolves these without requiring @types/react
  declare props: Readonly<Props>;
  declare setState: (updater: Partial<State> | ((prev: State) => Partial<State>)) => void;

  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
    captureException(error, { context: this.props.context, componentStack: info.componentStack });
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      // __DEV__ is a React Native global; fall back to false when not defined
      const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
      const userMessage = isDev
        ? this.state.error.message
        : 'An unexpected error occurred. Please try again.';

      return (
        <View style={localStyles.container} accessibilityRole="alert">
          <Text style={localStyles.title}>
            {this.props.context ?? 'Something went wrong'}
          </Text>
          <Text style={localStyles.message}>{userMessage}</Text>
          <TouchableOpacity style={localStyles.button} onPress={this.reset} accessibilityRole="button">
            <Text style={localStyles.buttonText}>Try Again</Text>
          </TouchableOpacity>
          {this.props.onGoBack && (
            <TouchableOpacity
              style={[localStyles.button, localStyles.secondaryButton]}
              onPress={this.props.onGoBack}
              accessibilityRole="button"
            >
              <Text style={[localStyles.buttonText, localStyles.secondaryButtonText]}>Go Back</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const localStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F5F7FA' },
  title: { fontSize: 20, fontWeight: '700', color: '#d32f2f', marginBottom: 12, textAlign: 'center' },
  message: { fontSize: 14, color: '#546E7A', textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  button: { backgroundColor: '#1565C0', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8, marginBottom: 12, minWidth: 160, alignItems: 'center' },
  buttonText: { color: '#ffffff', fontWeight: '600', fontSize: 15 },
  secondaryButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#B0BEC5' },
  secondaryButtonText: { color: '#546E7A' },
});

export default ErrorBoundary;
