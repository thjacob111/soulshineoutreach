import Nav from "@/components/Nav"
import Link from "next/link"
export default function Page() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Nav />
      <section className="bg-gradient-to-b from-slate-600 to-slate-700 text-white text-center py-20 px-6">
        <h1 className="text-4xl font-black mb-3">Business Solutions</h1>
        <p className="text-gray-300 max-w-xl mx-auto">Connecting local businesses with community resources, partnerships, and growth opportunities.</p>
      </section>
      <section className="py-16 px-6 max-w-3xl mx-auto text-center">
        <p className="text-gray-500 mb-8">Full details coming soon. Contact us to schedule a free consultation.</p>
        <Link href="/contact" className="bg-amber-400 hover:bg-amber-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors">Schedule a Free Consultation</Link>
      </section>
      <footer className="mt-auto py-8 px-6 text-center text-gray-400 text-sm border-t border-gray-100">
        © Soul Shine Community Outreach Foundation
      </footer>
    </div>
  )
}
