import { describe, expect, it } from 'vitest';

import { ApiError } from './api';
import { errorMessage } from './errors';

describe('errorMessage', () => {
  it('uses the ApiError message', () => {
    expect(errorMessage(new ApiError('rawText is too long', 400))).toBe('rawText is too long');
  });

  it('uses a plain Error message', () => {
    expect(errorMessage(new Error('network down'))).toBe('network down');
  });

  it('falls back for values that are not errors', () => {
    expect(errorMessage('a string')).toBe('Request failed');
    expect(errorMessage(undefined)).toBe('Request failed');
    expect(errorMessage({ message: 'ignored' })).toBe('Request failed');
  });
});
