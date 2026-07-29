import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '../test/renderWithProviders';
import { DeleteFeedbackDialog } from './DeleteFeedbackDialog';

function setup(overrides: Partial<React.ComponentProps<typeof DeleteFeedbackDialog>> = {}) {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    isDeleting: false,
    ...overrides,
  };
  renderWithProviders(<DeleteFeedbackDialog {...props} />);
  return props;
}

describe('DeleteFeedbackDialog', () => {
  it('renders nothing while closed', () => {
    setup({ isOpen: false });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('warns that the action is irreversible', () => {
    setup();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
  });

  it('confirms the removal', async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Remove' }),
    );

    expect(props.onConfirm).toHaveBeenCalledOnce();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('closes on cancel', async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' }),
    );

    expect(props.onClose).toHaveBeenCalledOnce();
    expect(props.onConfirm).not.toHaveBeenCalled();
  });

  it('locks Cancel while the delete is in flight', () => {
    setup({ isDeleting: true });
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });
});
