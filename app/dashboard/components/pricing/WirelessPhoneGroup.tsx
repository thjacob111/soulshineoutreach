'use client'
import { GroupBox } from './GroupBox'
import { PlanTable } from './PlanTable'
import { RidersTable } from './RidersTable'
import { DiscountsTable } from './DiscountsTable'
import type { WirelessGroup, WirelessPlanRow } from '@/lib/pricing/types'

interface WirelessPhoneGroupProps {
  label: string
  data: WirelessGroup
  onRowTitleClick?: (row: WirelessPlanRow) => void
  onChange?: (data: WirelessGroup) => void
}

export function WirelessPhoneGroup({ label, data, onRowTitleClick, onChange }: WirelessPhoneGroupProps) {
  return (
    <GroupBox label={label} variant="child">
      <div className="flex flex-col">
        <div className="border border-gray-400 rounded-t-md p-2">
          <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Plan</p>
          <PlanTable rows={data.plans} onRowTitleClick={onRowTitleClick} onChange={plans => onChange?.({ ...data, plans })} />
        </div>
        <div className="border border-gray-400 border-t-0 p-2">
          <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Riders</p>
          <RidersTable riders={data.riders} onChange={riders => onChange?.({ ...data, riders })} />
        </div>
        <div className="border border-gray-400 border-t-0 p-2">
          <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Discounts</p>
          <DiscountsTable rows={data.discounts} onChange={discounts => onChange?.({ ...data, discounts })} />
        </div>
        <div className="border border-gray-400 border-t-0 rounded-b-md p-2">
          <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Promotions</p>
          <DiscountsTable rows={data.promotions} showHeader={false} onChange={promotions => onChange?.({ ...data, promotions })} />
        </div>
      </div>
    </GroupBox>
  )
}