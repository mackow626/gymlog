import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { Dashboard } from './Dashboard'
import { api } from '../hooks/api'

vi.mock('../hooks/api', () => ({
  api: {
    getSessions: vi.fn(),
    deleteSession: vi.fn(),
  },
}))

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows empty state when no sessions', async () => {
    vi.mocked(api.getSessions).mockResolvedValue([])

    render(<Dashboard setPage={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Brak treningów. Zacznij pierwszy!')).toBeInTheDocument()
    })
  })

  it('navigates to edit page when edit button is clicked', async () => {
    const setPage = vi.fn()
    vi.mocked(api.getSessions).mockResolvedValue([
      { id: 6, date: '2026-03-16', notes: 'Test sesji' },
    ])

    render(<Dashboard setPage={setPage} />)

    const editButton = await screen.findByRole('button', { name: 'Edytuj' })
    await userEvent.click(editButton)

    expect(setPage).toHaveBeenCalledWith({ name: 'edit-session', id: 6 })
  })
})
