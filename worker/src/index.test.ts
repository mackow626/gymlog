import { describe, expect, it } from 'vitest'
import app from './index'

type QueryResult = {
  results?: any[]
  first?: any
  run?: any
}

class MockDB {
  private handlers: Array<{ match: RegExp; result: QueryResult }> = []

  on(match: RegExp, result: QueryResult) {
    this.handlers.push({ match, result })
    return this
  }

  prepare(sql: string) {
    const handler = this.handlers.find(h => h.match.test(sql))
    const result = handler?.result ?? {}

    return {
      bind: (..._params: unknown[]) => ({
        all: async <T>() => ({ results: (result.results ?? []) as T[] }),
        first: async <T>() => (result.first ?? null) as T,
        run: async () => (result.run ?? { meta: { last_row_id: 1 } }),
      }),
      all: async <T>() => ({ results: (result.results ?? []) as T[] }),
      first: async <T>() => (result.first ?? null) as T,
      run: async () => (result.run ?? { meta: { last_row_id: 1 } }),
    }
  }

  async exec(_sql: string) {
    return
  }
}

describe('Worker API endpoints', () => {
  it('GET /api/sessions returns sessions list', async () => {
    const db = new MockDB().on(/SELECT \* FROM sessions ORDER BY date DESC LIMIT 100/i, {
      results: [{ id: 6, date: '2026-03-16', notes: 'Test' }],
    })

    const res = await app.request('/api/sessions', {}, { DB: db as unknown as D1Database })
    const body = await res.json() as any

    expect(res.status).toBe(200)
    expect(body).toEqual([{ id: 6, date: '2026-03-16', notes: 'Test' }])
  })

  it('POST /api/sessions validates payload', async () => {
    const db = new MockDB()
    const res = await app.request(
      '/api/sessions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trisets: [] }),
      },
      { DB: db as unknown as D1Database }
    )

    const body = await res.json() as any
    expect(res.status).toBe(400)
    expect(body.error).toContain('Session must include a date')
  })

  it('PUT /api/sessions/:id returns 400 for invalid id', async () => {
    const db = new MockDB()
    const res = await app.request(
      '/api/sessions/not-a-number',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: '2026-03-16', trisets: [{ exercises: [{ exercise_id: 1, series: [{}] }] }] }),
      },
      { DB: db as unknown as D1Database }
    )

    const body = await res.json() as any
    expect(res.status).toBe(400)
    expect(body.error).toBe('Invalid session ID')
  })

  it('GET /api/exercises/:id/last-stats returns parsed series', async () => {
    const db = new MockDB().on(/SELECT te\.weight_kg, te\.reps, te\.comments, te\.sets/i, {
      first: {
        weight_kg: '[100,90,80]',
        reps: '[5,8,10]',
        sets: 3,
      },
    })

    const res = await app.request('/api/exercises/41/last-stats', {}, { DB: db as unknown as D1Database })
    const body = await res.json() as any

    expect(res.status).toBe(200)
    expect(body).toEqual({
      series: [
        { weight_kg: 100, reps: 5 },
        { weight_kg: 90, reps: 8 },
        { weight_kg: 80, reps: 10 },
      ],
    })
  })

  it('GET /api/stats/week returns aggregated shape', async () => {
    const db = new MockDB()
      .on(/SELECT COUNT\(\*\) as cnt FROM sessions/i, { first: { cnt: 2 } })
      .on(/SELECT e\.muscle_groups, SUM\(COALESCE\(te\.sets, 1\)\) as cnt/i, {
        results: [
          { muscle_groups: '["nogi"]', cnt: 6 },
          { muscle_groups: '["plecy","biceps"]', cnt: 3 },
        ],
      })
      .on(/SELECT s\.date, COUNT\(te\.id\) as exercises/i, {
        results: [{ date: '2026-03-16', exercises: 6 }],
      })

    const res = await app.request('/api/stats/week', {}, { DB: db as unknown as D1Database })
    const body = await res.json() as any

    expect(res.status).toBe(200)
    expect(body.sessions).toBe(2)
    expect(body.totalSeries).toBe(9)
    expect(body.muscleGroups.nogi).toBe(6)
    expect(body.muscleGroups.plecy).toBe(3)
    expect(body.muscleGroups.biceps).toBe(3)
    expect(body.perDay).toEqual([{ date: '2026-03-16', exercises: 6 }])
  })
})
