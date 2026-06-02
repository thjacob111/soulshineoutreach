'use client'
import { GroupBox } from './GroupBox'
import { InternetPlanTable } from './InternetPlanTable'
import { RidersTable } from './RidersTable'
import { DiscountsTable } from './DiscountsTable'
import type { InternetGroup as InternetGroupData, InternetPlanRow } from '@/lib/pricing/types'

interface Props { data: InternetGroupData; onRowTitleClick?: (row: InternetPlanRow) => void; onChange?: (data: InternetGroupData) => void }

export function InternetGroup({ data, onRowTitleClick, onChange }: Props) {
  return (
    <GroupBox label={data.label} variant="child">
      <div className="flex flex-col">
        <div className="border border-gray-400 rounded-t-md p-2">
          <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Plan</p>
          <InternetPlanTable rows={data.plans} onRowTitleClick={onRowTitleClick} onChange={plans => onChange?.({ ...data, plans })} />
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