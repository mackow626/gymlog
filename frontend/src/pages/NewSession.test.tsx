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
        { weight_kg: 36, reps: 12 },
        { weight_kg: 30, reps: 10 },
        { weight_kg: 25, reps: 8 },
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

      // First series from history
      expect((firstInputs[0] as HTMLInputElement).value).toBe('36')
      expect((firstInputs[1] as HTMLInputElement).value).toBe('12')
      
      // Second series from history
      expect((secondInputs[0] as HTMLInputElement).value).toBe('30')
      expect((secondInputs[1] as HTMLInputElement).value).toBe('10')
      
      // Third series from history
      expect((thirdInputs[0] as HTMLInputElement).value).toBe('25')
      expect((thirdInputs[1] as HTMLInputElement).value).toBe('8')
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
})
