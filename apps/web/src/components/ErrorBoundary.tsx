import { Alert, Button, Container, Stack } from '@chakra-ui/react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Catches render-time crashes so a single broken subtree does not leave the
 * user staring at a blank page. React has no hook equivalent for this.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <Container maxW="3xl" py={16}>
        <Stack gap={4} align="flex-start">
          <Alert.Root status="error" variant="subtle">
            <Alert.Title>Something went wrong</Alert.Title>
            <Alert.Description>{error.message || 'Unexpected error.'}</Alert.Description>
          </Alert.Root>
          <Button onClick={this.handleReset}>Try again</Button>
        </Stack>
      </Container>
    );
  }
}
