import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { SessionDetail } from './SessionDetail'
import { api } from '../hooks/api'

vi.mock('../hooks/api', () => ({
  api: {
    getSession: vi.fn(),
  },
}))

describe('SessionDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows series comments and aggregated series per muscle group', async () => {
    vi.mocked(api.getSession).mockResolvedValue({
      id: 123,
      date: '2026-03-23',
      notes: 'Trening testowy',
      trisets: [
        {
          id: 1,
          position: 1,
          exercises: [
            {
              id: 100,
              position: 1,
              name: 'Wyciskanie',
              muscle_groups: '["klatka"]',
              weight_kg: '[100,90]',
              reps: '[6,8]',
              comments: '["pauza na dole",""]',
              sets: 2,
            },
            {
              id: 101,
              position: 2,
              name: 'Wiosłowanie',
              muscle_groups: '["plecy"]',
              weight_kg: '[70]',
              reps: '[10]',
              comments: '["pełen zakres"]',
              sets: 1,
            },
          ],
        },
      ],
    })

    const { container } = render(<SessionDetail id={123} setPage={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Serie na partie ciała')).toBeInTheDocument()
    })

    expect(screen.getByText('Łącznie: 3')).toBeInTheDocument()

    const summaryGroups = Array.from(container.querySelectorAll('.session-summary-group')).map(
      node => node.textContent?.trim()
    )
    expect(summaryGroups).toEqual(['klatka', 'plecy'])

    expect(screen.getByText('2 serii')).toBeInTheDocument()
    expect(screen.getByText('1 serii')).toBeInTheDocument()

    expect(screen.getByText('pauza na dole')).toBeInTheDocument()
    expect(screen.getByText('pełen zakres')).toBeInTheDocument()
  })
})
