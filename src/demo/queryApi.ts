import type { QueryGroup } from '../filter-builder'

export interface SubmitQueryRequest {
  query: QueryGroup
}

export interface SubmitQueryResponse {
  id: string
  status: 'accepted'
}

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
