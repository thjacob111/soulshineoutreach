export type CarrierName = 'AT&T' | 'Verizon' | 'T-Mobile' | 'Spectrum' | 'Mint' | 'Cox' | 'Frontier' | 'Ezee'
export type UserType = 'Personal' | 'Business'

export interface PriceCell {
  standard: string
  bundled: string
  promo: string
  promoDuration: string
}

export interface WirelessPlanSubRow {
  calling: { coverage: string; strength: string; callLimit: string }
  text: { textLimit: string }
  data: { dataLimit: string; loweredSpeed: string; dataSpeed: string }
  hotspot: { limit: string; speed: string }
  price: PriceCell
}

export interface WirelessPlanRow {
  id: string
  title: string
  domestic: WirelessPlanSubRow
  international: WirelessPlanSubRow
  longDistance: WirelessPlanSubRow
}

export interface RiderRow {
  id: string
  title: string
  notes: string
  price: PriceCell
}

export interface DiscountRow {
  id: string
  title: string
  description: string
  eligibility: string
  price: PriceCell
}

export interface WirelessGroup {
  plans: WirelessPlanRow[]
  riders: RiderRow[]
  discounts: DiscountRow[]
  promotions: DiscountRow[]
}

export interface DeviceDropdowns {
  device: string
  brand: string
  year: string
  model: string
  storage: string
  condition: string
}

export interface TradeInTier {
  lessThan: string
  rangeMin: string
  rangeMax: string
  greaterThan: string
  promoLessThan: string
  promoRange: string
  promoGreaterThan: string
}

export interface TradeInCalculator {
  currentDevice: DeviceDropdowns
  tradeInStandard: string
  tradeInPromo: string
  translatorTiers: TradeInTier
  newDevice: DeviceDropdowns
  cost: string
  customerTotal: string
  customerMonthly: string
  customerMonths: string
}

export interface WirelessDevicesGroup {
  tradeIn: TradeInCalculator
}

export interface InternetPlanRow {
  id: string
  title: string
  usage: {
    term: string
    speeds: {
      down: { min: string; max: string }
      up: { min: string; max: string }
    }
    data: {
      cap: string
      extraCharge: {
        tier1: { data: string; charge: string }
        tier2: { data: string; charge: string }
      }
    }
  }
  install: {
    linesRun: {
      phase1: { type: string; routing: string }
      phase2: { type: string; routing: string }
    }
  }
  equipment: {
    cost: string
    router: { provided: string; cost: string }
    backupPower: string
  }
  price: PriceCell
}

export interface InternetGroup {
  label: 'Fiber' | 'Coax' | '5G'
  plans: InternetPlanRow[]
  riders: RiderRow[]
  discounts: DiscountRow[]
  promotions: DiscountRow[]
}

export interface PricingState {
  carrier: CarrierName
  userType: UserType
  wireless: {
    phones: WirelessGroup
    accessories: WirelessGroup
    devices: WirelessDevicesGroup
  }
  internet: {
    fiber: InternetGroup
    coax: InternetGroup
    fiveG: InternetGroup
  }
}

export interface EditModeContextValue {
  isEditing: boolean
  isAdmin: boolean
  startEdit: () => void
  saveEdit: () => void
  cancelEdit: () => void
}
