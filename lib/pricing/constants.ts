import type { CarrierName, UserType, PricingState, WirelessGroup, InternetGroup, WirelessDevicesGroup } from './types'

export const CARRIERS: CarrierName[] = ['AT&T', 'Verizon', 'T-Mobile', 'Spectrum', 'Mint', 'Cox', 'Frontier', 'Ezee']
export const USER_TYPES: UserType[] = ['Personal', 'Business']

export const DEVICE_BRANDS = ['Apple', 'Samsung', 'Google', 'Motorola', 'OnePlus', 'LG', 'Other']
export const DEVICE_CONDITIONS = ['New', 'Excellent', 'Good', 'Fair', 'Poor']
export const DEVICE_STORAGE_OPTIONS = ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB']

export const WIRELESS_PLAN_COLUMNS = [
  {
    label: 'Calling',
    children: [
      { key: 'calling.coverage', label: 'Coverage' },
      { key: 'calling.strength', label: 'Strength' },
      { key: 'calling.callLimit', label: 'Call Limit' },
    ],
  },
  {
    label: 'Text',
    children: [{ key: 'text.textLimit', label: 'Text Limit' }],
  },
  {
    label: 'Data',
    children: [
      { key: 'data.dataLimit', label: 'Data Limit' },
      { key: 'data.loweredSpeed', label: 'Lowered Speed After Limit' },
      { key: 'data.dataSpeed', label: 'Data Speed' },
    ],
  },
  {
    label: 'Hotspot',
    children: [
      { key: 'hotspot.limit', label: 'Limit' },
      { key: 'hotspot.speed', label: 'Speed' },
    ],
  },
] as const

export const INTERNET_PLAN_COLUMNS = [
  {
    label: 'Usage',
    children: [
      { key: 'usage.term', label: 'Term' },
      { key: 'usage.speeds.down.min', label: 'Down Min' },
      { key: 'usage.speeds.down.max', label: 'Down Max' },
      { key: 'usage.speeds.up.min', label: 'Up Min' },
      { key: 'usage.speeds.up.max', label: 'Up Max' },
      { key: 'usage.data.cap', label: 'Data Cap' },
      { key: 'usage.data.extraCharge.tier1.data', label: 'Tier 1 Data' },
      { key: 'usage.data.extraCharge.tier1.charge', label: 'Tier 1 Charge' },
      { key: 'usage.data.extraCharge.tier2.data', label: 'Tier 2 Data' },
      { key: 'usage.data.extraCharge.tier2.charge', label: 'Tier 2 Charge' },
    ],
  },
  {
    label: 'Install',
    children: [
      { key: 'install.linesRun.phase1.type', label: 'Phase 1 Type' },
      { key: 'install.linesRun.phase1.routing', label: 'Phase 1 Routing' },
      { key: 'install.linesRun.phase2.type', label: 'Phase 2 Type' },
      { key: 'install.linesRun.phase2.routing', label: 'Phase 2 Routing' },
    ],
  },
  {
    label: 'Equipment',
    children: [
      { key: 'equipment.cost', label: 'Cost' },
      { key: 'equipment.router.provided', label: 'Provided Router' },
      { key: 'equipment.router.cost', label: 'Router Cost' },
      { key: 'equipment.backupPower', label: 'Backup Power' },
    ],
  },
] as const

function emptyWirelessGroup(): WirelessGroup {
  return { plans: [], riders: [], discounts: [], promotions: [] }
}

function emptyInternetGroup(label: 'Fiber' | 'Coax' | '5G'): InternetGroup {
  return { label, plans: [], riders: [], discounts: [], promotions: [] }
}

function emptyDevices(): WirelessDevicesGroup {
  return {
    tradeIn: {
      currentDevice: { device: '', brand: '', year: '', model: '', submodel: '', storage: '', condition: '' },
      tradeInStandard: '',
      tradeInPromo: '',
      translatorTiers: { lessThan: '', rangeMin: '', rangeMax: '', greaterThan: '', promoLessThan: '', promoRange: '', promoGreaterThan: '' },
      newDevice: { device: '', brand: '', year: '', model: '', submodel: '', storage: '', condition: '' },
      cost: '',
      customerTotal: '',
      customerMonthly: '',
      customerMonths: '',
    },
  }
}

export function createEmptyPricingState(): PricingState {
  return {
    carrier: 'AT&T',
    userType: 'Personal',
    wireless: {
      phones: emptyWirelessGroup(),
      accessories: emptyWirelessGroup(),
      devices: emptyDevices(),
    },
    internet: {
      fiber: emptyInternetGroup('Fiber'),
      coax: emptyInternetGroup('Coax'),
      fiveG: emptyInternetGroup('5G'),
    },
  }
}
