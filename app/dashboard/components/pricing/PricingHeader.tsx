'use client'
import { CARRIERS, USER_TYPES } from '@/lib/pricing/constants'
import { useEditMode } from './EditModeContext'
import type { CarrierName, UserType } from '@/lib/pricing/types'

interface PricingHeaderProps {
  carrier: CarrierName
  userType: UserType
  onCarrierChange: (c: CarrierName) => void
  onUserTypeChange: (u: UserType) => void
}

export function PricingHeader({ carrier, userType, onCarrierChange, onUserTypeChange }: PricingHeaderProps) {
  const { isEditing, isAdmin, startEdit, saveEdit, cancelEdit } = useEditMode()
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-gray-600">Company</label>
        <select className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-800" value={carrier} onChange={e => onCarrierChange(e.target.value as CarrierName)}>
          {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-gray-600">User</label>
        <select className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-800" value={userType} onChange={e => onUserTypeChange(e.target.value as UserType)}>
          {USER_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {isAdmin && !isEditing && (
          <button onClick={startEdit} className="px-3 py-1 text-sm font-medium border border-blue-500 text-blue-600 rounded hover:bg-blue-50">Edit</button>
        )}
        {isEditing && (
          <>
            <button onClick={cancelEdit} className="px-3 py-1 text-sm font-medium border border-gray-400 text-gray-600 rounded hover:bg-gray-50">Cancel</button>
            <button onClick={saveEdit} className="px-3 py-1 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
          </>
        )}
      </div>
    </div>
  )
}