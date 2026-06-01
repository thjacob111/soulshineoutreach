import Link from 'next/link'

function SunIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="10" fill="#F59E0B" />
      <line x1="24" y1="4"  x2="24" y2="10" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
      <line x1="24" y1="38" x2="24" y2="44" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
      <line x1="4"  y1="24" x2="10" y2="24" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
      <line x1="38" y1="24" x2="44" y2="24" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
      <line x1="9.37"  y1="9.37"  x2="13.6"  y2="13.6"  stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
      <line x1="34.4"  y1="34.4"  x2="38.63" y2="38.63" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
      <line x1="38.63" y1="9.37"  x2="34.4"  y2="13.6"  stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
      <line x1="13.6"  y1="34.4"  x2="9.37"  y2="38.63" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export default function GuestHome() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <SunIcon />
          <span className="text-lg font-bold text-gray-900">Soul Shine Outreach</span>
        </div>
        <Link href="/auth"
          className="bg-amber-400 hover:bg-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          Sign In
        </Link>
      </nav>

      {/* Welcome */}
      <section className="flex flex-col items-center text-center px-6 py-20 bg-amber-50">
        <p className="text-amber-600 font-medium text-sm uppercase tracking-widest mb-3">Welcome</p>
        <h1 className="text-4xl font-bold text-gray-900 max-w-2xl leading-tight mb-4">
          You are in the right place.
        </h1>
        <p className="text-lg text-gray-600 max-w-xl">
          Soul Shine is here to help your household save money, improve your wellbeing, and connect you with the best local resources — all for free.
        </p>
      </section>

      {/* Services */}
      <section className="py-16 px-6 max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">What we can help you with</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: '⚡', title: 'Lower Your Utility Bills', desc: 'We compare your energy, gas, water, internet, and security bills and find you better options at no cost.' },
            { icon: '🌿', title: 'Improve Your Wellness', desc: 'Get personalized guidance on nutrition, movement, sleep, and stress so you can feel your best every day.' },
            { icon: '🏘️', title: 'Connect With Your Community', desc: 'We link you with local businesses, programs, and civic resources that support your household and neighborhood.' },
          ].map(item => (
            <div key={item.title} className="rounded-2xl border border-gray-100 p-6 text-center hover:shadow-sm transition-shadow">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-6 text-center border-t border-gray-100 mt-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to get started?</h2>
        <p className="text-gray-500 mb-6">Create a free account to request your personalized assessment.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/auth?mode=signup"
            className="bg-amber-400 hover:bg-amber-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
            Create Free Account
          </Link>
          <Link href="/auth"
            className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium px-6 py-3 rounded-lg transition-colors">
            Sign In
          </Link>
        </div>
      </section>
    </div>
  )
}
