'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import AttWireless from './components/AttWireless'
import LeadsTab from './components/LeadsTab'
import OrderOverlay from './components/OrderOverlay'

type Tab = 'leads' | 'portfolio' | 'contracts' | 'messages'

const VIEW_SIZES: Record<string, { width: number; height: number }> = {
  'Mobile (Portrait)':  { width: 390,  height: 844  },
  'Mobile (Landscape)': { width: 844,  height: 390  },
  'Tablet (Portrait)':  { width: 820,  height: 1180 },
  'Tablet (Landscape)': { width: 1180, height: 820  },
  'Desktop':            { width: 1440, height: 900  },
}

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'leads', label: 'Leads', icon: '👥' },
  { key: 'portfolio', label: 'Portfolio', icon: '📚' },
  { key: 'contracts', label: 'Contracts', icon: '📄' },
  { key: 'messages', label: 'Messages', icon: '💬' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('leads')
  const [portfolioItem, setPortfolioItem] = useState<string | null>(null)
  const [openOrderId, setOpenOrderId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<string>('Desktop')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/')
      } else {
        setUser(session.user)
      }
    })
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!user) return null

  const { width, height } = VIEW_SIZES[viewMode]

  return (
    <div className="min-h-screen bg-gray-300 flex items-start justify-center p-3">
      <div
        className="flex flex-col bg-white overflow-hidden"
        style={{ width, height, maxWidth: 'calc(100vw - 24px)', maxHeight: 'calc(100vh - 24px)' }}
      >
        <header className="flex items-center justify-between px-4 py-3 bg-amber-500">
          <h1 className="text-white font-bold text-lg">Soul Shine</h1>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
            <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.85)', fontWeight: '600' }}>View</label>
            <select
              value={viewMode}
              onChange={e => setViewMode(e.target.value)}
              style={{ fontSize: '10px', padding: '1px 3px', border: '1px solid #ccc', borderRadius: '3px', backgroundColor: 'white', margin: 0 }}
            >
              {Object.keys(VIEW_SIZES).map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <button onClick={handleLogout} className="text-white text-sm opacity-80 hover:opacity-100">
            Sign Out
          </button>
        </header>

        {openOrderId && <OrderOverlay orderId={openOrderId} onClose={() => setOpenOrderId(null)} />}

        <main className="flex-1 overflow-y-auto p-4">
          {activeTab === 'leads' && <LeadsTab onOpenOrder={setOpenOrderId} />}
          {activeTab === 'portfolio' && (
            portfolioItem === 'att'
              ? <AttWireless onBack={() => setPortfolioItem(null)} />
              : <PortfolioTab onSelect={setPortfolioItem} />
          )}
          {activeTab === 'contracts' && <ContractsTab />}
          {activeTab === 'messages' && <MessagesTab />}
        </main>

        <nav className="flex border-t bg-white">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex flex-col items-center py-2 text-xs gap-1 transition-colors ${
                activeTab === tab.key ? 'text-amber-500 font-semibold' : 'text-gray-400'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}


function PortfolioTab({ onSelect }: { onSelect: (item: string) => void }) {
  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-gray-800 text-base">Sales Portfolio</h2>
      <button
        onClick={() => onSelect('att')}
        className="w-full flex items-center gap-3 border-2 border-blue-600 rounded-xl p-4 hover:bg-blue-50 transition-colors text-left"
      >
        <div className="bg-blue-600 text-white font-bold text-xs px-2 py-1 rounded">AT&T</div>
        <div>
          <div className="font-semibold text-gray-800 text-sm">AT&T Wireless</div>
          <div className="text-xs text-gray-400">Orders · Tracking · Commissions</div>
        </div>
        <span className="ml-auto text-gray-300 text-lg">›</span>
      </button>
    </div>
  )
}

function ContractsTab() {
  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-gray-800 text-base">Contracts & Compensation</h2>
      <p className="text-gray-400 text-sm">Your documents — coming soon.</p>
    </div>
  )
}

function MessagesTab() {
  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-gray-800 text-base">Messages</h2>
      <p className="text-gray-400 text-sm">SMS inbox — coming soon.</p>
    </div>
  )
}
