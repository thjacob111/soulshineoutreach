import Nav from '@/components/Nav'
const sections = [
  { label: 'Locality', items: ['City', 'State', 'Country'] },
  { label: 'International Affairs', items: ['Global news and foreign policy updates'] },
  { label: 'Statecraft', items: ['Government Policy Changes', 'Politician Profiles & Activities'] },
  { label: 'Economy', items: ['Economic Overview', 'Stock Market', 'Business News'] },
  { label: 'Media', items: ['Media Updates', 'Distractions by Design — what to avoid'] },
  { label: 'Environment', items: ['Weather', 'Ecology'] },
  { label: 'Opportunity', items: ['Jobs Available'] },
]
export default function News() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Nav />
      <section className="bg-gradient-to-b from-slate-700 to-slate-800 text-white text-center py-20 px-6">
        <h1 className="text-4xl font-black mb-2">Good News Network</h1>
        <p className="text-amber-400 font-semibold tracking-widest text-sm uppercase mb-3">GNN</p>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">Dedicated to keeping people informed with real news.</p>
      </section>
      <section className="py-16 px-6 max-w-5xl mx-auto w-full">
        <div className="bg-amber-50 rounded-2xl p-6 mb-10 text-center">
          <p className="text-gray-600">Community news hub — eventually auto-updated with AI agents to surface what matters most to Peoria County residents.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {sections.map(s => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3">{s.label}</h3>
              <ul className="space-y-1">
                {s.items.map(item => (
                  <li key={item} className="text-sm text-gray-500 flex gap-2"><span className="text-amber-400">•</span>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <footer className="mt-auto py-8 px-6 text-center text-gray-400 text-sm border-t border-gray-100">
        © {new Date().getFullYear()} Soul Shine Community Outreach Foundation
      </footer>
    </div>
  )
}
