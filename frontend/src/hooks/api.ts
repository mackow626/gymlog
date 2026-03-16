const BASE = 'https://gymlog-worker.maciejkowalczuk.workers.dev'

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const api = {
  // muscle groups
  getMuscleGroups: ()                       => req<any[]>('GET', '/api/muscle-groups'),
  createMuscleGroup: (b: any)               => req<any>('POST', '/api/muscle-groups', b),
  updateMuscleGroup: (id: number, b: any)   => req<any>('PUT', `/api/muscle-groups/${id}`, b),
  deleteMuscleGroup: (id: number)           => req<any>('DELETE', `/api/muscle-groups/${id}`),
  // exercises
  getExercises: ()                          => req<any[]>('GET', '/api/exercises'),
  createExercise: (b: any)                  => req<any>('POST', '/api/exercises', b),
  updateExercise: (id: number, b: any)      => req<any>('PUT', `/api/exercises/${id}`, b),
  deleteExercise: (id: number)              => req<any>('DELETE', `/api/exercises/${id}`),
  // sessions
  getSessions: ()                           => req<any[]>('GET', '/api/sessions'),
  getSession: (id: number)                  => req<any>('GET', `/api/sessions/${id}`),
  createSession: (b: any)                   => req<any>('POST', '/api/sessions', b),
  deleteSession: (id: number)               => req<any>('DELETE', `/api/sessions/${id}`),
  // stats
  getStats: (period: 'week' | 'month')      => req<any>('GET', `/api/stats/${period}`),
}
