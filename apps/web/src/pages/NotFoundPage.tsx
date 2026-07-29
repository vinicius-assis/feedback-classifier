import { Button, Container, Heading, Stack, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Container maxW="3xl" py={16}>
      <Stack gap={4} align="flex-start">
        <Heading as="h1" size="xl">
          Page not found
        </Heading>
        <Text color="fg.muted">This URL does not match any screen in the app.</Text>
        <Button colorPalette="brand" onClick={() => navigate('/dashboard')}>
          Back to dashboard
        </Button>
      </Stack>
    </Container>
  );
}
