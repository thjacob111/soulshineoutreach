'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { EditModeProvider } from './pricing/EditModeContext'
import { PricingHeader } from './pricing/PricingHeader'
import { WirelessSection } from './pricing/WirelessSection'
import { InternetSection } from './pricing/InternetSection'
import { PlanDetailsPanel } from './pricing/PlanDetailsPanel'
import type { PanelSchema } from './pricing/PlanDetailsPanel'
import { createEmptyPricingState, WIRELESS_PLAN_COLUMNS, INTERNET_PLAN_COLUMNS } from '@/lib/pricing/constants'
import type { PricingState, CarrierName, UserType, WirelessPlanRow, InternetPlanRow } from '@/lib/pricing/types'

const ADMIN_EMAIL = 'thjacob111@gmail.com'

type DetailState = {
  row: (WirelessPlanRow | InternetPlanRow) & Record<string, unknown>
  schema: PanelSchema
  source: string
} | null

export default function PricingAndCommissions({ onBack }: { onBack?: () => void } = {}) {
  const [state, setState] = useState<PricingState>(createEmptyPricingState())
  const [isAdmin, setIsAdmin] = useState(false)
  const [detail, setDetail] = useState<DetailState>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email === ADMIN_EMAIL) setIsAdmin(true)

      const { data } = await supabase
        .from('att_pricing_config')
        .select('pricing_v2')
        .eq('id', 1)
        .single()

      if (data?.pricing_v2) setState(data.pricing_v2 as PricingState)
    }
    init()
  }, [])

  const scheduleSave = (next: PricingState) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await supabase
        .from('att_pricing_config')
        .upsert({ id: 1, pricing_v2: next, updated_at: new Date().toISOString() })
    }, 1500)
  }

  const update = (next: PricingState) => { setState(next); scheduleSave(next) }

  const openDetail = (row: WirelessPlanRow | InternetPlanRow, source: string, type: 'wireless' | 'internet') => {
    setDetail({
      row: row as (WirelessPlanRow | InternetPlanRow) & Record<string, unknown>,
      schema: type === 'wireless' ? WIRELESS_PLAN_COLUMNS : INTERNET_PLAN_COLUMNS,
      source,
    })
  }

  return (
    <EditModeProvider isAdmin={isAdmin} onSave={() => scheduleSave(state)}>
      <div className="min-h-screen bg-gray-50">
        <PricingHeader
          carrier={state.carrier}
          userType={state.userType}
          onCarrierChange={(carrier: CarrierName) => update({ ...state, carrier })}
          onUserTypeChange={(userType: UserType) => update({ ...state, userType })}
        />
        <div className="p-4 flex flex-col gap-6">
          <WirelessSection
            data={state.wireless}
            onRowTitleClick={(row, source) => openDetail(row, source, 'wireless')}
            onChange={wireless => update({ ...state, wireless })}
          />
          <InternetSection
            data={state.internet}
            onRowTitleClick={(row, source) => openDetail(row, source, 'internet')}
            onChange={internet => update({ ...state, internet })}
          />
        </div>
        {detail && (
          <PlanDetailsPanel
            row={detail.row}
            schema={detail.schema}
            source={detail.source}
            onClose={() => setDetail(null)}
          />
        )}
      </div>
    </EditModeProvider>
  )
}