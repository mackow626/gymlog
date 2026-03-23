import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NewSession } from './NewSession'
import { api } from '../hooks/api'

vi.mock('../hooks/api', () => ({
  api: {
    getExercises: vi.fn(),
    getSession: vi.fn(),
    createSession: vi.fn(),
    updateSession: vi.fn(),
    getLastExerciseStats: vi.fn(),
  },
}))

describe('NewSession exercise suggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fills all series from suggestion history', async () => {
    vi.mocked(api.getExercises).mockResolvedValue([
      { id: 41, name: 'Wykroki z hantlami', muscle_groups: '["nogi"]' },
    ])
    vi.mocked(api.getLastExerciseStats).mockResolvedValue({
      series: [
        { weight_kg: 36, reps: 12, comment: 'ciężko, ale czysto' },
        { weight_kg: 30, reps: 10, comment: 'krótsza przerwa' },
        { weight_kg: 25, reps: 8, comment: 'ostatnia do upadku' },
      ],
    })

    const { container } = render(<NewSession setPage={vi.fn()} />)

    const select = (await screen.findAllByRole('combobox'))[0]
    await userEvent.selectOptions(select, '41')

    await waitFor(() => {
      const firstExercise = container.querySelector('.ex-block')
      expect(firstExercise).not.toBeNull()
      const rows = firstExercise!.querySelectorAll('.series-row')
      const firstInputs = rows[0].querySelectorAll('input')
      const secondInputs = rows[1].querySelectorAll('input')
      const thirdInputs = rows[2].querySelectorAll('input')
      const firstComment = rows[0].querySelector('textarea') as HTMLTextAreaElement
      const secondComment = rows[1].querySelector('textarea') as HTMLTextAreaElement
      const thirdComment = rows[2].querySelector('textarea') as HTMLTextAreaElement

      // First series from history
      expect((firstInputs[0] as HTMLInputElement).value).toBe('36')
      expect((firstInputs[1] as HTMLInputElement).value).toBe('12')
      expect(firstComment.value).toBe('ciężko, ale czysto')
      
      // Second series from history
      expect((secondInputs[0] as HTMLInputElement).value).toBe('30')
      expect((secondInputs[1] as HTMLInputElement).value).toBe('10')
      expect(secondComment.value).toBe('krótsza przerwa')
      
      // Third series from history
      expect((thirdInputs[0] as HTMLInputElement).value).toBe('25')
      expect((thirdInputs[1] as HTMLInputElement).value).toBe('8')
      expect(thirdComment.value).toBe('ostatnia do upadku')
    })
  })

  it('clears all series when no suggestion is available', async () => {
    vi.mocked(api.getExercises).mockResolvedValue([
      { id: 41, name: 'Wykroki z hantlami', muscle_groups: '["nogi"]' },
      { id: 42, name: 'Martwy ciąg', muscle_groups: '["nogi"]' },
    ])

    vi.mocked(api.getLastExerciseStats)
      .mockResolvedValueOnce({ series: [{ weight_kg: 36, reps: 12 }] })
      .mockResolvedValueOnce(null)

    const { container } = render(<NewSession setPage={vi.fn()} />)

    const select = (await screen.findAllByRole('combobox'))[0]
    await userEvent.selectOptions(select, '41')
    await userEvent.selectOptions(select, '42')

    await waitFor(() => {
      const firstExercise = container.querySelector('.ex-block')
      const rows = firstExercise!.querySelectorAll('.series-row')
      
      // All series should be cleared when no history available
      rows.forEach((row) => {
        const inputs = row.querySelectorAll('input')
        expect((inputs[0] as HTMLInputElement).value).toBe('')
        expect((inputs[1] as HTMLInputElement).value).toBe('')
      })
    })
  })

  it('fills only available series when history has fewer series than form', async () => {
    vi.mocked(api.getExercises).mockResolvedValue([
      { id: 41, name: 'Wykroki z hantlami', muscle_groups: '["nogi"]' },
    ])
    vi.mocked(api.getLastExerciseStats).mockResolvedValue({
      series: [
        { weight_kg: 36, reps: 12 },
        { weight_kg: 30, reps: 10 },
        // Only 2 series in history but form has 3
      ],
    })

    const { container } = render(<NewSession setPage={vi.fn()} />)

    const select = (await screen.findAllByRole('combobox'))[0]
    await userEvent.selectOptions(select, '41')

    await waitFor(() => {
      const firstExercise = container.querySelector('.ex-block')
      expect(firstExercise).not.toBeNull()
      const rows = firstExercise!.querySelectorAll('.series-row')
      const firstInputs = rows[0].querySelectorAll('input')
      const secondInputs = rows[1].querySelectorAll('input')
      const thirdInputs = rows[2].querySelectorAll('input')

      // First two series from history
      expect((firstInputs[0] as HTMLInputElement).value).toBe('36')
      expect((firstInputs[1] as HTMLInputElement).value).toBe('12')
      expect((secondInputs[0] as HTMLInputElement).value).toBe('30')
      expect((secondInputs[1] as HTMLInputElement).value).toBe('10')
      
      // Third series should be empty (no data in history)
      expect((thirdInputs[0] as HTMLInputElement).value).toBe('')
      expect((thirdInputs[1] as HTMLInputElement).value).toBe('')
    })
  })

  it('updates muscle-group series summary live while editing', async () => {
    vi.mocked(api.getExercises).mockResolvedValue([
      { id: 41, name: 'Wykroki z hantlami', muscle_groups: '["nogi"]' },
    ])
    vi.mocked(api.getLastExerciseStats).mockResolvedValue(null)

    const { container } = render(<NewSession setPage={vi.fn()} />)

    const select = (await screen.findAllByRole('combobox'))[0]
    await userEvent.selectOptions(select, '41')

    await waitFor(() => {
      expect(screen.getByText('Łącznie: 0')).toBeInTheDocument()
    })

    const firstExercise = container.querySelector('.ex-block')
    expect(firstExercise).not.toBeNull()

    const rows = firstExercise!.querySelectorAll('.series-row')
    const firstRowInputs = rows[0].querySelectorAll('input')
    const secondRowInputs = rows[1].querySelectorAll('input')

    await userEvent.type(firstRowInputs[0] as HTMLInputElement, '40')
    await userEvent.type(firstRowInputs[1] as HTMLInputElement, '10')
    await userEvent.type(secondRowInputs[1] as HTMLInputElement, '8')

    await waitFor(() => {
      expect(screen.getByText('Łącznie: 2')).toBeInTheDocument()
      expect(screen.getByText('nogi')).toBeInTheDocument()
      expect(screen.getByText('2 serii')).toBeInTheDocument()
    })
  })

  it('allows adding the 4th exercise to triset', async () => {
    vi.mocked(api.getExercises).mockResolvedValue([
      { id: 41, name: 'Wykroki z hantlami', muscle_groups: '["nogi"]' },
    ])
    vi.mocked(api.getLastExerciseStats).mockResolvedValue(null)

    render(<NewSession setPage={vi.fn()} />)

    const selectsBefore = await screen.findAllByRole('combobox')
    expect(selectsBefore).toHaveLength(3)

    await userEvent.click(screen.getByRole('button', { name: /dodaj ćwiczenie do tri-setu/i }))

    await waitFor(async () => {
      const selectsAfter = await screen.findAllByRole('combobox')
      expect(selectsAfter).toHaveLength(4)
    })
  })

  it('in edit mode saves and stays on page when clicking Zapisz', async () => {
    const setPage = vi.fn()

    vi.mocked(api.getExercises).mockResolvedValue([
      { id: 41, name: 'Wykroki z hantlami', muscle_groups: '["nogi"]' },
    ])
    vi.mocked(api.getSession).mockResolvedValue({
      id: 77,
      date: '2026-03-23',
      notes: 'test',
      trisets: [
        {
          id: 1,
          position: 1,
          exercises: [
            {
              id: 500,
              position: 1,
              exercise_id: 41,
              weight_kg: '[40]',
              reps: '[10]',
              comments: '["ok"]',
              sets: 1,
            },
          ],
        },
      ],
    })
    vi.mocked(api.updateSession).mockResolvedValue({ ok: true })

    render(<NewSession setPage={setPage} sessionId={77} />)

    await screen.findByText('Edytuj trening')

    const saveButtons = screen.getAllByRole('button', { name: 'Zapisz' })
    await userEvent.click(saveButtons[0])

    await waitFor(() => {
      expect(api.updateSession).toHaveBeenCalledWith(77, expect.any(Object))
      expect(setPage).not.toHaveBeenCalled()
      expect(screen.getByText('Zapisano zmiany.')).toBeInTheDocument()
    })
  })

  it('in edit mode saves and exits when clicking Zapisz i wyjdź', async () => {
    const setPage = vi.fn()

    vi.mocked(api.getExercises).mockResolvedValue([
      { id: 41, name: 'Wykroki z hantlami', muscle_groups: '["nogi"]' },
    ])
    vi.mocked(api.getSession).mockResolvedValue({
      id: 88,
      date: '2026-03-23',
      notes: 'test',
      trisets: [
        {
          id: 1,
          position: 1,
          exercises: [
            {
              id: 501,
              position: 1,
              exercise_id: 41,
              weight_kg: '[45]',
              reps: '[8]',
              comments: '["ciężko"]',
              sets: 1,
            },
          ],
        },
      ],
    })
    vi.mocked(api.updateSession).mockResolvedValue({ ok: true })

    render(<NewSession setPage={setPage} sessionId={88} />)

    await screen.findByText('Edytuj trening')

    const saveAndExitButtons = screen.getAllByRole('button', { name: 'Zapisz i wyjdź' })
    await userEvent.click(saveAndExitButtons[0])

    await waitFor(() => {
      expect(api.updateSession).toHaveBeenCalledWith(88, expect.any(Object))
      expect(setPage).toHaveBeenCalledWith({ name: 'session', id: 88 })
    })
  })
})
