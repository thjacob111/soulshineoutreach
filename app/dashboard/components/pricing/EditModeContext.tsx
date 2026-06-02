'use client'
import { createContext, useContext, useState } from 'react'
import type { EditModeContextValue } from '@/lib/pricing/types'

const EditModeContext = createContext<EditModeContextValue | null>(null)

export function useEditMode(): EditModeContextValue {
  const ctx = useContext(EditModeContext)
  if (!ctx) throw new Error('useEditMode must be used inside EditModeProvider')
  return ctx
}

interface Props {
  isAdmin: boolean
  onSave: () => void
  children: React.ReactNode
}

export function EditModeProvider({ isAdmin, onSave, children }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const startEdit = () => { if (isAdmin) setIsEditing(true) }
  const saveEdit = () => { onSave(); setIsEditing(false) }
  const cancelEdit = () => setIsEditing(false)
  return (
    <EditModeContext.Provider value={{ isEditing, isAdmin, startEdit, saveEdit, cancelEdit }}>
      {children}
    </EditModeContext.Provider>
  )
}