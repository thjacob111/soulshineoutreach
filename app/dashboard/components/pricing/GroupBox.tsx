'use client'

interface GroupBoxProps {
  label: string
  variant?: 'parent' | 'child'
  className?: string
  children: React.ReactNode
}

export function GroupBox({ label, variant = 'child', className = '', children }: GroupBoxProps) {
  const border = variant === 'parent' ? 'border-2 border-gray-700 rounded-lg' : 'border border-gray-400 rounded-md'
  const labelColor = variant === 'parent' ? 'text-gray-800 font-bold' : 'text-gray-600 font-semibold'
  return (
    <div className={`relative ${border} p-3 mt-4 ${className}`}>
      <span className={`absolute -top-3 left-3 px-1 bg-white text-xs ${labelColor}`}>
        {label}
      </span>
      {children}
    </div>
  )
}