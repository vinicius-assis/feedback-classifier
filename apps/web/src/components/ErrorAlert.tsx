import { Alert } from '@chakra-ui/react';

type ErrorAlertProps = {
  title: string;
  description?: string;
  /** Keeps line breaks in the description — needed for API error payloads. */
  preserveWhitespace?: boolean;
};

/** Inline "something failed to load" banner. */
export function ErrorAlert({ title, description, preserveWhitespace = false }: ErrorAlertProps) {
  return (
    <Alert.Root status="error" variant="subtle">
      <Alert.Title>{title}</Alert.Title>
      {description ? (
        <Alert.Description whiteSpace={preserveWhitespace ? 'pre-wrap' : undefined}>
          {description}
        </Alert.Description>
      ) : null}
    </Alert.Root>
  );
}
