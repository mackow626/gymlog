import { Hono } from 'hono'
import { cors } from 'hono/cors'

export interface Env {
  DB: D1Database
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

async function validateSessionExercises(
  db: D1Database,
  trisets: Array<{
    exercises: Array<{ exercise_id: number }>
  }>
) {
  const exerciseIds = [...new Set(
    trisets.flatMap(ts => ts.exercises.map(ex => ex.exercise_id)).filter(Boolean)
  )]

  if (!exerciseIds.length) {
    return { ok: false, error: 'Dodaj przynajmniej jedno ćwiczenie.' as const }
  }

  const placeholders = exerciseIds.map(() => '?').join(',')
  const existing = await db.prepare(
    `SELECT id FROM exercises WHERE id IN (${placeholders})`
  ).bind(...exerciseIds).all<{ id: number }>()

  if ((existing.results?.length ?? 0) !== exerciseIds.length) {
    return { ok: false, error: 'Wybrane ćwiczenie nie istnieje już w bibliotece.' as const }
  }

  return { ok: true as const }
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function normalizeSeriesForStorage(ex: {
  weight_kg?: number
  reps?: number
  sets?: number
  series?: Array<{ weight_kg?: number; reps?: number; comment?: string }>
}) {
  if (Array.isArray(ex.series) && ex.series.length > 0) {
    const weights = ex.series.map(s => toNullableNumber(s.weight_kg))
    const reps = ex.series.map(s => toNullableNumber(s.reps))
    const comments = ex.series.map(s => {
      const value = typeof s.comment === 'string' ? s.comment.trim() : ''
      return value.length ? value : null
    })
    return {
      weights,
      reps,
      comments,
      count: ex.series.length,
    }
  }

  const count = Number.isFinite(Number(ex.sets)) && Number(ex.sets) > 0 ? Number(ex.sets) : 1
  const legacyWeight = toNullableNumber(ex.weight_kg)
  const legacyReps = toNullableNumber(ex.reps)

  return {
    weights: Array.from({ length: count }, () => legacyWeight),
    reps: Array.from({ length: count }, () => legacyReps),
    comments: Array.from({ length: count }, () => null),
    count,
  }
}

// ── MUSCLE GROUPS ────────────────────────────────────────────────────────────

app.get('/api/muscle-groups', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT * FROM muscle_groups ORDER BY name ASC'
  ).all()
  return c.json(rows.results)
})

app.post('/api/muscle-groups', async (c) => {
  const { name } = await c.req.json<{ name: string }>()
  if (!name || !name.trim()) return c.json({ error: 'Missing name' }, 400)
  const result = await c.env.DB.prepare(
    'INSERT INTO muscle_groups (name) VALUES (?)'
  ).bind(name.trim()).run()
  return c.json({ id: result.meta.last_row_id, name: name.trim() })
})

app.put('/api/muscle-groups/:id', async (c) => {
  const id = c.req.param('id')
  const { name } = await c.req.json<{ name: string }>()
  if (!name || !name.trim()) return c.json({ error: 'Missing name' }, 400)
  await c.env.DB.prepare(
    'UPDATE muscle_groups SET name=? WHERE id=?'
  ).bind(name.trim(), id).run()
  return c.json({ ok: true })
})

app.delete('/api/muscle-groups/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM muscle_groups WHERE id=?').bind(id).run()
  return c.json({ ok: true })
})

// ── EXERCISES ────────────────────────────────────────────────────────────────

app.get('/api/exercises', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT * FROM exercises ORDER BY name ASC'
  ).all()
  return c.json(rows.results)
})

app.post('/api/exercises', async (c) => {
  const { name, muscle_groups } = await c.req.json<{ name: string; muscle_groups: string[] }>()
  if (!name || !muscle_groups?.length) return c.json({ error: 'Missing fields' }, 400)
  const result = await c.env.DB.prepare(
    'INSERT INTO exercises (name, muscle_groups) VALUES (?, ?)'
  ).bind(name.trim(), JSON.stringify(muscle_groups)).run()
  return c.json({ id: result.meta.last_row_id, name, muscle_groups })
})

app.put('/api/exercises/:id', async (c) => {
  const id = c.req.param('id')
  const { name, muscle_groups } = await c.req.json<{ name: string; muscle_groups: string[] }>()
  await c.env.DB.prepare(
    'UPDATE exercises SET name=?, muscle_groups=? WHERE id=?'
  ).bind(name.trim(), JSON.stringify(muscle_groups), id).run()
  return c.json({ ok: true })
})

app.delete('/api/exercises/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM exercises WHERE id=?').bind(id).run()
  return c.json({ ok: true })
})

app.get('/api/exercises/:id/last-stats', async (c) => {
  const exerciseId = c.req.param('id')

  const lastExercise = await c.env.DB.prepare(`
    SELECT te.weight_kg, te.reps, te.comments, te.sets
    FROM triset_exercises te
    JOIN trisets ts ON ts.id = te.triset_id
    JOIN sessions s ON s.id = ts.session_id
    WHERE te.exercise_id = ?
    ORDER BY s.date DESC, s.id DESC
    LIMIT 1
  `).bind(exerciseId).first<{ weight_kg: string; reps: string; comments?: string; sets: number }>()

  if (!lastExercise) {
    return c.json(null)
  }

  try {
    const weights = JSON.parse(lastExercise.weight_kg ?? '[]')
    const reps = JSON.parse(lastExercise.reps ?? '[]')
    const comments = JSON.parse(lastExercise.comments ?? '[]')
    const count = Number.isFinite(Number(lastExercise.sets)) ? Number(lastExercise.sets) : Math.max(
      Array.isArray(weights) ? weights.length : 0,
      Array.isArray(reps) ? reps.length : 0,
      Array.isArray(comments) ? comments.length : 0
    )

    // Build series array from parsed weights and reps
    const series = Array.from({ length: count }, (_, i) => ({
      weight_kg: Array.isArray(weights) && i < weights.length ? weights[i] : undefined,
      reps: Array.isArray(reps) && i < reps.length ? reps[i] : undefined,
      comment: Array.isArray(comments) && i < comments.length && typeof comments[i] === 'string'
        ? comments[i]
        : undefined,
    }))

    // Filter out series with no data
    const filteredSeries = series.filter(s => s.weight_kg !== undefined || s.reps !== undefined || s.comment !== undefined)

    if (filteredSeries.length === 0) {
      return c.json(null)
    }

    return c.json({ series: filteredSeries })
  } catch {
    return c.json(null)
  }
})

// ── SESSIONS ─────────────────────────────────────────────────────────────────

app.get('/api/sessions', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT * FROM sessions ORDER BY date DESC LIMIT 100'
  ).all()
  return c.json(rows.results)
})

app.get('/api/sessions/:id', async (c) => {
  const id = c.req.param('id')
  const session = await c.env.DB.prepare('SELECT * FROM sessions WHERE id=?').bind(id).first()
  if (!session) return c.json({ error: 'Not found' }, 404)

  const trisets = await c.env.DB.prepare(
    'SELECT * FROM trisets WHERE session_id=? ORDER BY position ASC'
  ).bind(id).all()

  const result = []
  for (const ts of trisets.results as any[]) {
    const exercises = await c.env.DB.prepare(`
      SELECT te.*, e.name, e.muscle_groups
      FROM triset_exercises te
      JOIN exercises e ON e.id = te.exercise_id
      WHERE te.triset_id=? ORDER BY te.position ASC
    `).bind(ts.id).all()
    result.push({ ...ts, exercises: exercises.results })
  }

  return c.json({ ...session, trisets: result })
})

app.post('/api/sessions', async (c) => {
  const { date, notes, trisets } = await c.req.json<{
    date: string
    notes?: string
    trisets: Array<{
      exercises: Array<{
        exercise_id: number
        weight_kg?: number
        reps?: number
        sets?: number
        series?: Array<{ weight_kg?: number; reps?: number; comment?: string }>
      }>
    }>
  }>()

  if (!date || !trisets?.some(ts => ts.exercises?.length)) {
    return c.json({ error: 'Session must include a date and at least one exercise' }, 400)
  }

  const validation = await validateSessionExercises(c.env.DB, trisets)
  if (!validation.ok) return c.json({ error: validation.error }, 400)

  // TRANSACTION REMOVED FOR DEV
  try {
    const session = await c.env.DB.prepare(
      'INSERT INTO sessions (date, notes) VALUES (?, ?)'
    ).bind(date, notes || null).run()
    const sessionId = session.meta.last_row_id

    for (let ti = 0; ti < trisets.length; ti++) {
      const ts = trisets[ti]
      const tsRow = await c.env.DB.prepare(
        'INSERT INTO trisets (session_id, position) VALUES (?, ?)'
      ).bind(sessionId, ti + 1).run()
      const tsId = tsRow.meta.last_row_id

      for (let ei = 0; ei < ts.exercises.length; ei++) {
        const ex = ts.exercises[ei]
        const normalized = normalizeSeriesForStorage(ex)
        await c.env.DB.prepare(
          'INSERT INTO triset_exercises (triset_id, exercise_id, position, weight_kg, reps, comments, sets) VALUES (?,?,?,?,?,?,?)'
        ).bind(
          tsId,
          ex.exercise_id,
          ei + 1,
          JSON.stringify(normalized.weights),
          JSON.stringify(normalized.reps),
          JSON.stringify(normalized.comments),
          normalized.count
        ).run()
      }
    }

    // COMMIT
    return c.json({ id: sessionId })
  } catch (error) {
    // ROLLBACK
    return c.json({ error: error instanceof Error ? error.message : "Failed to create session" }, 500)
  }
})

app.put('/api/sessions/:id', async (c) => {
  const idParam = c.req.param('id')
  const id = Number(idParam)
  const { date, notes, trisets } = await c.req.json<{
    date: string
    notes?: string
    trisets: Array<{
      exercises: Array<{
        exercise_id: number
        weight_kg?: number
        reps?: number
        sets?: number
        series?: Array<{ weight_kg?: number; reps?: number; comment?: string }>
      }>
    }>
  }>()

  if (!Number.isFinite(id)) {
    return c.json({ error: 'Invalid session ID' }, 400)
  }

  if (!date || !trisets?.some(ts => ts.exercises?.length)) {
    return c.json({ error: 'Session must include a date and at least one exercise' }, 400)
  }

  const validation = await validateSessionExercises(c.env.DB, trisets)
  if (!validation.ok) return c.json({ error: validation.error }, 400)

  const existing = await c.env.DB.prepare(
    'SELECT id FROM sessions WHERE id=?'
  ).bind(id).first()

  if (!existing) return c.json({ error: 'Not found' }, 404)

  // TRANSACTION REMOVED FOR DEV
  try {
    await c.env.DB.prepare(
      'UPDATE sessions SET date=?, notes=? WHERE id=?'
    ).bind(date, notes || null, id).run()

    await c.env.DB.prepare(
      'DELETE FROM trisets WHERE session_id=?'
    ).bind(id).run()

    for (let ti = 0; ti < trisets.length; ti++) {
      const ts = trisets[ti]
      const tsRow = await c.env.DB.prepare(
        'INSERT INTO trisets (session_id, position) VALUES (?, ?)'
      ).bind(id, ti + 1).run()
      const tsId = tsRow.meta.last_row_id

      for (let ei = 0; ei < ts.exercises.length; ei++) {
        const ex = ts.exercises[ei]
        const normalized = normalizeSeriesForStorage(ex)
        await c.env.DB.prepare(
          'INSERT INTO triset_exercises (triset_id, exercise_id, position, weight_kg, reps, comments, sets) VALUES (?,?,?,?,?,?,?)'
        ).bind(
          tsId,
          ex.exercise_id,
          ei + 1,
          JSON.stringify(normalized.weights),
          JSON.stringify(normalized.reps),
          JSON.stringify(normalized.comments),
          normalized.count
        ).run()
      }
    }

    // COMMIT
    return c.json({ ok: true })
  } catch (error) {
    console.error('PUT /api/sessions/:id error:', error instanceof Error ? error.message : error)
    // ROLLBACK
    return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

app.delete('/api/sessions/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM sessions WHERE id=?').bind(id).run()
  return c.json({ ok: true })
})

// ── STATS ─────────────────────────────────────────────────────────────────────

app.get('/api/stats/:period', async (c) => {
  const period = c.req.param('period') // 'week' | 'month'
  const since = period === 'week'
    ? new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
    : new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

  // sessions count
  const sessionsCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as cnt FROM sessions WHERE date >= ?"
  ).bind(since).first<{ cnt: number }>()

  // muscle group breakdown
  const rows = await c.env.DB.prepare(`
    SELECT e.muscle_groups, SUM(COALESCE(te.sets, 1)) as cnt
    FROM triset_exercises te
    JOIN trisets ts ON ts.id = te.triset_id
    JOIN sessions s ON s.id = ts.session_id
    JOIN exercises e ON e.id = te.exercise_id
    WHERE s.date >= ?
    GROUP BY e.muscle_groups
  `).bind(since).all()

  const muscleMap: Record<string, number> = {}
  let totalSeries = 0
  for (const row of rows.results as any[]) {
    const groups: string[] = JSON.parse(row.muscle_groups)
    const count = Number(row.cnt) || 0
    totalSeries += count
    for (const g of groups) {
      muscleMap[g] = (muscleMap[g] || 0) + count
    }
  }

  // exercises per day
  const perDay = await c.env.DB.prepare(`
    SELECT s.date, COUNT(te.id) as exercises
    FROM sessions s
    JOIN trisets ts ON ts.session_id = s.id
    JOIN triset_exercises te ON te.triset_id = ts.id
    WHERE s.date >= ?
    GROUP BY s.date ORDER BY s.date ASC
  `).bind(since).all()

  return c.json({
    sessions: sessionsCount?.cnt ?? 0,
    totalSeries,
    muscleGroups: muscleMap,
    perDay: perDay.results
  })
})

export default app
