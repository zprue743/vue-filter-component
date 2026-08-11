import type { QueryGroup } from '../filter-builder'

/** JSON body accepted by `POST /api/queries`. */
export interface SubmitQueryRequest {
  /** Query tree to validate and execute on the backend. */
  query: QueryGroup
}

/** Minimal acknowledgement returned by the sample endpoint. */
export interface SubmitQueryResponse {
  /** Backend-generated identifier for the submitted query. */
  id: string
  /** Indicates that asynchronous processing may begin. */
  status: 'accepted'
}

/** Posts a query tree to the sample backend endpoint. */
export async function submitQuery(
  query: QueryGroup,
  signal?: AbortSignal,
): Promise<SubmitQueryResponse> {
  const response = await fetch('/api/queries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query } satisfies SubmitQueryRequest),
    signal,
  })

  if (!response.ok) {
    throw new Error(`Query request failed with status ${response.status}`)
  }

  return response.json() as Promise<SubmitQueryResponse>
}
