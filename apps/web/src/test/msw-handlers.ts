import { http, HttpResponse } from 'msw';

import { API_BASE, makeFeedbackItem, makeListResult, makeStats } from './fixtures';

/**
 * Default happy-path handlers. Individual tests override with
 * `server.use(...)` for error and edge cases.
 */
export const handlers = [
  http.get(`${API_BASE}/feedback/stats/summary`, () => HttpResponse.json(makeStats())),

  http.get(`${API_BASE}/feedback`, () => HttpResponse.json(makeListResult())),

  http.get(`${API_BASE}/feedback/:id`, ({ params }) =>
    HttpResponse.json(makeFeedbackItem({ _id: String(params.id) })),
  ),

  http.post(`${API_BASE}/feedback`, () => HttpResponse.json(makeFeedbackItem(), { status: 201 })),

  http.post(`${API_BASE}/feedback/bulk`, () =>
    HttpResponse.json([{ index: 0, status: 'fulfilled', data: makeFeedbackItem() }]),
  ),

  http.post(`${API_BASE}/feedback/import`, () =>
    HttpResponse.json({ total: 3, fulfilled: 3, failed: 0, skipped: 0, errors: [] }),
  ),

  http.post(`${API_BASE}/feedback/:id/reclassify`, ({ params }) =>
    HttpResponse.json(makeFeedbackItem({ _id: String(params.id) })),
  ),

  http.delete(`${API_BASE}/feedback/:id`, () => new HttpResponse(null, { status: 204 })),
];
