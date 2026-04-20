import { Button, Dialog, Portal, Text } from '@chakra-ui/react';

interface DeleteFeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteFeedbackDialog({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteFeedbackDialogProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={({ open }) => !open && onClose()} role="alertdialog">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Remove feedback</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text>This action cannot be undone. Are you sure you want to remove this item?</Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={onClose} disabled={isDeleting}>
                Cancel
              </Button>
              <Button colorPalette="red" onClick={onConfirm} loading={isDeleting}>
                Remove
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
