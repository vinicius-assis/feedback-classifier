import { Portal, Stack, Toast, Toaster } from '@chakra-ui/react';

import { toaster } from './toaster';

/** Mount once under `ChakraProvider`; use `toaster.create(...)` from screens. */
export function AppToaster() {
  return (
    <Portal>
      <Toaster toaster={toaster}>
        {(toast) => (
          <Toast.Root width="sm">
            <Toast.Indicator />
            <Stack gap="1" flex="1" maxW="100%">
              {toast.title != null && String(toast.title).length > 0 ? (
                <Toast.Title>{toast.title}</Toast.Title>
              ) : null}
              {toast.description != null && String(toast.description).length > 0 ? (
                <Toast.Description>{toast.description}</Toast.Description>
              ) : null}
            </Stack>
            {toast.closable ? <Toast.CloseTrigger /> : null}
          </Toast.Root>
        )}
      </Toaster>
    </Portal>
  );
}
