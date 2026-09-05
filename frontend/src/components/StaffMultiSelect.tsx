import { useEffect, useState } from 'react'
import { usersApi } from '@/services/api'
import { mockUsers } from '@/services/mockData'
import type { User } from '@/types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

interface StaffMultiSelectProps {
  selectedIds: number[]
  onChange: (ids: number[]) => void
  label?: string
}

export function StaffMultiSelect({ selectedIds, onChange, label = 'Assign staff' }: StaffMultiSelectProps) {
  const [staff, setStaff] = useState<User[]>(USE_MOCK ? mockUsers : [])
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (USE_MOCK) return
    usersApi.getAll()
      .then((res) => {
        setStaff(Array.isArray(res.data) ? res.data : [])
        setLoadError('')
      })
      .catch(() => {
        setStaff([])
        setLoadError('Could not load employees. Refresh the page and try again.')
      })
  }, [])

  const toggle = (id: number) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])
  }

  return (
    <div className="space-y-2 sm:col-span-2">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">Select colleagues who should join this meeting. They will see it on their dashboard and calendar.</p>
      {loadError && <p className="text-sm text-destructive">{loadError}</p>}
      <div className="max-h-40 overflow-y-auto rounded-md border border-border divide-y divide-border">
        {!loadError && staff.length === 0 && (
          <p className="px-3 py-2 text-sm text-muted-foreground">No employees to invite.</p>
        )}
        {staff.map((person) => (
          <label key={person.id} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent/50 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-border"
              checked={selectedIds.includes(person.id)}
              onChange={() => toggle(person.id)}
            />
            <span>{person.fullName}</span>
            <span className="text-xs text-muted-foreground ml-auto">{person.departmentName || person.role}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
