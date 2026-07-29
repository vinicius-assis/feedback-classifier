import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { API_BASE } from '../test/fixtures';
import { renderWithProviders } from '../test/renderWithProviders';
import { server } from '../test/server';
import { toaster } from '../lib/toaster';
import { IngestFilePage } from './IngestFilePage';

let createToast: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  createToast = vi.spyOn(toaster, 'create').mockReturnValue('id');
});

type ToastArg = { type?: string; title?: string; description?: string };

/** `vi.spyOn` loses the argument types here, so recover them in one place. */
function toastArgs(): ToastArg[] {
  return (createToast.mock.calls as unknown as [ToastArg][]).map(([arg]) => arg);
}

function lastToast(): ToastArg | undefined {
  const args = toastArgs();
  return args[args.length - 1];
}

function fileInput(): HTMLInputElement {
  const input = document.querySelector('input[type="file"]');
  if (!input) throw new Error('file input not found');
  return input as HTMLInputElement;
}

const csv = () => new File(['feedback'], 'rows.csv', { type: 'text/csv' });

describe('IngestFilePage', () => {
  it('keeps the submit button disabled until a file is chosen', () => {
    renderWithProviders(<IngestFilePage />);
    expect(screen.getByRole('button', { name: 'Import and classify' })).toBeDisabled();
  });

  it('accepts a CSV and shows its name', async () => {
    renderWithProviders(<IngestFilePage />);

    await userEvent.upload(fileInput(), csv());

    expect(await screen.findByText(/Selected: rows.csv/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import and classify' })).toBeEnabled();
  });

  it('rejects an unsupported file before any upload', async () => {
    renderWithProviders(<IngestFilePage />);

    // `userEvent.upload` honours the input's `accept` filter, so it never
    // reaches the handler. Fire the change directly to cover the case where
    // the OS picker lets an unexpected type through ("All files").
    const input = fileInput();
    const invalid = new File(['x'], 'notes.txt', { type: 'text/plain' });
    Object.defineProperty(input, 'files', { value: [invalid], configurable: true });
    fireEvent.change(input);

    expect(lastToast()).toMatchObject({ type: 'error', title: 'Invalid file' });
    expect(screen.queryByText(/Selected:/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import and classify' })).toBeDisabled();
  });

  it('accepts a file dropped onto the drop zone', async () => {
    renderWithProviders(<IngestFilePage />);
    const dropzone = screen.getByRole('button', { name: /Drop a file here/ });

    fireEvent.drop(dropzone, { dataTransfer: { files: [csv()] } });

    expect(await screen.findByText(/Selected: rows.csv/)).toBeInTheDocument();
  });

  it('rejects an unsupported dropped file', async () => {
    renderWithProviders(<IngestFilePage />);
    const dropzone = screen.getByRole('button', { name: /Drop a file here/ });

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [new File(['x'], 'a.png', { type: 'image/png' })] },
    });

    await waitFor(() => expect(lastToast()).toMatchObject({ title: 'Invalid file' }));
  });

  it('reports a clean import and clears the selection', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${API_BASE}/feedback/import`, () =>
        HttpResponse.json({ total: 3, fulfilled: 3, failed: 0, skipped: 0, errors: [] }),
      ),
    );

    renderWithProviders(<IngestFilePage />);
    await userEvent.upload(fileInput(), csv());
    await user.click(screen.getByRole('button', { name: 'Import and classify' }));

    await waitFor(() =>
      expect(lastToast()).toMatchObject({
        type: 'success',
        title: 'Import complete',
        description: '3 saved',
      }),
    );
    await waitFor(() => expect(screen.queryByText(/Selected:/)).not.toBeInTheDocument());
  });

  it('summarizes skipped and rejected rows', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${API_BASE}/feedback/import`, () =>
        HttpResponse.json({
          total: 5,
          fulfilled: 2,
          failed: 1,
          skipped: 2,
          errors: [{ row: 4, message: 'empty' }],
        }),
      ),
    );

    renderWithProviders(<IngestFilePage />);
    await userEvent.upload(fileInput(), csv());
    await user.click(screen.getByRole('button', { name: 'Import and classify' }));

    await waitFor(() => expect(createToast).toHaveBeenCalled());

    const descriptions = toastArgs().map((arg) => arg.description);
    expect(descriptions).toContain('2 saved · 2 skipped (blank rows / header) · 1 rejected');
    expect(descriptions.some((d) => d?.includes('Row 4: empty'))).toBe(true);
  });

  it('caps the row-error preview at five entries', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${API_BASE}/feedback/import`, () =>
        HttpResponse.json({
          total: 8,
          fulfilled: 0,
          failed: 8,
          skipped: 0,
          errors: Array.from({ length: 8 }, (_, i) => ({ row: i + 1, message: 'bad' })),
        }),
      ),
    );

    renderWithProviders(<IngestFilePage />);
    await userEvent.upload(fileInput(), csv());
    await user.click(screen.getByRole('button', { name: 'Import and classify' }));

    await waitFor(() => {
      const descriptions = toastArgs().map((arg) => arg.description ?? '');
      expect(descriptions.some((d) => d.includes('… and 3 more'))).toBe(true);
    });
  });

  it('surfaces a failed upload', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${API_BASE}/feedback/import`, () =>
        HttpResponse.json({ message: 'file too large' }, { status: 413 }),
      ),
    );

    renderWithProviders(<IngestFilePage />);
    await userEvent.upload(fileInput(), csv());
    await user.click(screen.getByRole('button', { name: 'Import and classify' }));

    await waitFor(() =>
      expect(lastToast()).toMatchObject({
        type: 'error',
        title: 'Import failed',
        description: 'file too large',
      }),
    );
  });
});
