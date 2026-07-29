import { describe, expect, it } from 'vitest';

import { isAcceptedFile, isWithinSizeLimit, MAX_FILE_SIZE_BYTES } from './files';

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

describe('isWithinSizeLimit', () => {
  function sized(bytes: number): File {
    const f = new File(['x'], 'rows.csv', { type: 'text/csv' });
    Object.defineProperty(f, 'size', { value: bytes });
    return f;
  }

  it('accepts a file below the limit', () => {
    expect(isWithinSizeLimit(sized(1024))).toBe(true);
  });

  it('accepts a file exactly at the limit', () => {
    expect(isWithinSizeLimit(sized(MAX_FILE_SIZE_BYTES))).toBe(true);
  });

  it('rejects a file above the limit', () => {
    expect(isWithinSizeLimit(sized(MAX_FILE_SIZE_BYTES + 1))).toBe(false);
  });

  it('advertises the 10 MB limit the UI promises', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024);
  });
});
