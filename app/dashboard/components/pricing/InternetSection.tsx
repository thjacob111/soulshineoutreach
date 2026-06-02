'use client'
import { GroupBox } from './GroupBox'
import { InternetGroup } from './InternetGroup'
import type { InternetPlanRow, PricingState } from '@/lib/pricing/types'

interface Props {
  data: PricingState['internet']
  onRowTitleClick?: (row: InternetPlanRow, source: string) => void
  onChange?: (data: PricingState['internet']) => void
}

export function InternetSection({ data, onRowTitleClick, onChange }: Props) {
  return (
    <GroupBox label="Internet" variant="parent">
      <InternetGroup data={data.fiber} onRowTitleClick={row => onRowTitleClick?.(row, 'Fiber')} onChange={fiber => onChange?.({ ...data, fiber })} />
      <hr className="my-5 border-gray-300" />
      <InternetGroup data={data.coax} onRowTitleClick={row => onRowTitleClick?.(row, 'Coax')} onChange={coax => onChange?.({ ...data, coax })} />
      <hr className="my-5 border-gray-300" />
      <InternetGroup data={data.fiveG} onRowTitleClick={row => onRowTitleClick?.(row, '5G')} onChange={fiveG => onChange?.({ ...data, fiveG })} />
    </GroupBox>
  )
}