const ACCEPTED_MIME = new Set([
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

/**
 * Accepts by MIME type when the browser provides a trustworthy one, and falls
 * back to the extension — some browsers report an empty type for `.csv`.
 */
export function isAcceptedFile(file: File): boolean {
  if (ACCEPTED_MIME.has(file.type)) {
    return true;
  }
  const name = file.name.toLowerCase();
  return name.endsWith('.csv') || name.endsWith('.xlsx');
}
