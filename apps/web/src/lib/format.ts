const DATE_FORMAT = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

/**
 * Single date format for the whole app. Falls back to the raw string when the
 * value is not a parsable date, and to an em dash when it is missing.
 */
export function formatDate(iso?: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  try {
    return DATE_FORMAT.format(date);
  } catch {
    return iso;
  }
}

/** Truncates with an ellipsis, leaving strings at or below `max` untouched. */
export function truncateText(text: string, max = 72): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

/** `web_form` → `web form`; the UI capitalizes via CSS. */
export function humanizeSource(source: string): string {
  return source.replace(/_/g, ' ');
}
