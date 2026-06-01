import Nav from '@/components/Nav'
import Link from 'next/link'
const projects = [
  { title: 'Food Production Facilities', desc: 'Developing local food production infrastructure to support community food security and sustainable agriculture in Peoria County.', icon: '🌾' },
  { title: 'Medicinal Plants', desc: 'Cultivating medicinal plant gardens to provide natural wellness resources and educational opportunities for community members.', icon: '🌿' },
  { title: 'Family Neighborhoods', desc: 'Creating sustainable, resource-efficient neighborhood initiatives that strengthen family bonds and community resilience.', icon: '🏘️' },
  { title: 'Mobile Homes', desc: 'Supporting mobile home communities with utility optimization, wellness resources, and access to local services.', icon: '🏠' },
]
export default function Projects() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Nav />
      <section className="bg-gradient-to-b from-slate-700 to-slate-800 text-white text-center py-20 px-6">
        <h1 className="text-4xl font-black mb-3">Projects</h1>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">Sustainability projects Soul Shine is funding and supporting in our community.</p>
      </section>
      <section className="py-16 px-6 max-w-5xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-8">
          {projects.map(p => (
            <div key={p.title} className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">{p.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{p.title}</h3>
              <p className="text-gray-500 leading-relaxed mb-4">{p.desc}</p>
              <Link href="/contact" className="text-amber-600 font-semibold hover:underline text-sm">Learn More →</Link>
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
