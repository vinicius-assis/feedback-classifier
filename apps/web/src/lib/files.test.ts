import { describe, expect, it } from 'vitest';

import { isAcceptedFile } from './files';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function file(name: string, type = ''): File {
  return new File(['col'], name, { type });
}

describe('isAcceptedFile', () => {
  it('accepts by MIME type', () => {
    expect(isAcceptedFile(file('data.bin', 'text/csv'))).toBe(true);
    expect(isAcceptedFile(file('data.bin', XLSX_MIME))).toBe(true);
  });

  it('accepts by extension when the browser reports no MIME type', () => {
    expect(isAcceptedFile(file('feedback.csv'))).toBe(true);
    expect(isAcceptedFile(file('feedback.xlsx'))).toBe(true);
  });

  it('matches the extension case-insensitively', () => {
    expect(isAcceptedFile(file('FEEDBACK.CSV'))).toBe(true);
    expect(isAcceptedFile(file('Feedback.XlsX'))).toBe(true);
  });

  it('rejects unrelated types and extensions', () => {
    expect(isAcceptedFile(file('notes.txt', 'text/plain'))).toBe(false);
    expect(isAcceptedFile(file('sheet.xls', 'application/vnd.ms-excel'))).toBe(false);
    expect(isAcceptedFile(file('image.png', 'image/png'))).toBe(false);
  });

  it('rejects a name that merely contains the extension', () => {
    expect(isAcceptedFile(file('csv-notes.txt'))).toBe(false);
  });
});
