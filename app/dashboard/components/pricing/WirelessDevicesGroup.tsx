'use client'
import { GroupBox } from './GroupBox'
import { TradeInCalculator } from './TradeInCalculator'
import type { WirelessDevicesGroup as DevicesData } from '@/lib/pricing/types'

interface Props { data: DevicesData; onChange?: (data: DevicesData) => void }

export function WirelessDevicesGroup({ data, onChange }: Props) {
  return (
    <GroupBox label="Devices" variant="child">
      <GroupBox label="Trade-In Value Calculator" variant="child">
        <TradeInCalculator data={data.tradeIn} onChange={tradeIn => onChange?.({ ...data, tradeIn })} />
      </GroupBox>
      <GroupBox label="Device Pricing Database" variant="child">
        <div className="flex items-center justify-center py-8 text-sm text-gray-400 italic">
          Device pricing database — spreadsheet import coming soon
        </div>
      </GroupBox>
    </GroupBox>
  )
}