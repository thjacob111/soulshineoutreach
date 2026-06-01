import Nav from '@/components/Nav'
import Link from 'next/link'
export default function About() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Nav />
      <section className="bg-gradient-to-b from-slate-700 to-slate-800 text-white text-center py-20 px-6">
        <h1 className="text-4xl font-black mb-3">About Soul Shine</h1>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">Building prosperity and connectedness through local collaboration.</p>
      </section>
      <section className="py-16 px-6 max-w-3xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Who We Are</h2>
        <p className="text-gray-600 leading-relaxed mb-6">The Soul Shine Community Outreach Foundation is a multidisciplinary service organization dedicated to strengthening prosperity and connection on a community level. Through grassroots outreach, public education, and cross-sector collaboration, we serve as a nexus between residents, local businesses, and civic leaders.</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">What We Do</h2>
        <p className="text-gray-600 leading-relaxed mb-6">Our team provides free educational resources, needs assessments, and consultations that help communities identify opportunities for sustainable growth — ranging from home-efficiency programs and wellness initiatives to local business partnerships and workforce development.</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
        <p className="text-gray-600 leading-relaxed mb-8">To empower communities to become more resilient, resource-efficient, and interconnected, creating systems where economic and personal wellbeing support one another.</p>
        <Link href="/contact" className="bg-amber-400 hover:bg-amber-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors">Contact Us</Link>
      </section>
      <footer className="mt-auto py-8 px-6 text-center text-gray-400 text-sm border-t border-gray-100">
        © {new Date().getFullYear()} Soul Shine Community Outreach Foundation
      </footer>
    </div>
  )
}
