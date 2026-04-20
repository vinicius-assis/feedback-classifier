import { createToaster, type CreateToasterReturn } from '@chakra-ui/react';

/** Shared toaster store for app-wide notifications (Chakra UI v3). */
export const toaster: CreateToasterReturn = createToaster({
  placement: 'bottom-end',
});
