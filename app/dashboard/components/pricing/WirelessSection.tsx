'use client'
import { GroupBox } from './GroupBox'
import { WirelessPhoneGroup } from './WirelessPhoneGroup'
import { WirelessDevicesGroup } from './WirelessDevicesGroup'
import type { WirelessPlanRow, PricingState } from '@/lib/pricing/types'

interface Props {
  data: PricingState['wireless']
  onRowTitleClick?: (row: WirelessPlanRow, source: string) => void
  onChange?: (data: PricingState['wireless']) => void
}

export function WirelessSection({ data, onRowTitleClick, onChange }: Props) {
  return (
    <GroupBox label="Wireless" variant="parent">
      <WirelessPhoneGroup label="Phones" data={data.phones} onRowTitleClick={row => onRowTitleClick?.(row, 'Phones')} onChange={phones => onChange?.({ ...data, phones })} />
      <hr className="my-5 border-gray-300" />
      <WirelessPhoneGroup label="Accessories" data={data.accessories} onRowTitleClick={row => onRowTitleClick?.(row, 'Accessories')} onChange={accessories => onChange?.({ ...data, accessories })} />
      <hr className="my-5 border-gray-300" />
      <WirelessDevicesGroup data={data.devices} onChange={devices => onChange?.({ ...data, devices })} />
    </GroupBox>
  )
}