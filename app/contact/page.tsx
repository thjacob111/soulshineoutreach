"use client"
import { useState } from 'react'
import Nav from '@/components/Nav'
export default function Contact() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [form, setForm] = useState({ name: '', contact: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  function handleSub(e: React.FormEvent) {
    e.preventDefault()
    setSubscribed(true)
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSent(true)
  }
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Nav />
      <section className="bg-gradient-to-b from-slate-700 to-slate-800 text-white text-center py-20 px-6">
        <h1 className="text-4xl font-black mb-3">Connect With Us!</h1>
        <p className="text-gray-300 text-lg">We would love to hear from you.</p>
      </section>
      <section className="py-16 px-6 max-w-5xl mx-auto w-full grid md:grid-cols-2 gap-12">
        {/* Contact Info */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Get In Touch</h2>
          <div className="space-y-4 mb-10">
            {[['📮', 'Mailing Address', 'PO Box — Peoria County, IL'],['📧', 'Email', 'Business Email'],['📞', 'Phone', 'Business Phone #']].map(([icon, label, val]) => (
              <div key={label} className="flex items-start gap-3">
                <span className="text-2xl">{icon}</span>
                <div><div className="font-medium text-gray-900 text-sm">{label}</div><div className="text-gray-500 text-sm">{val}</div></div>
              </div>
            ))}
          </div>
          {/* Mailing List */}
          <div className="bg-amber-50 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-2">Join Our Mailing List</h3>
            <p className="text-sm text-gray-500 mb-4">Stay informed about community news, events, and resources.</p>
            {subscribed ? (
              <p className="text-green-600 font-medium text-sm">You are subscribed!</p>
            ) : (
              <form onSubmit={handleSub} className="flex gap-2">
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                <button type="submit" className="bg-amber-400 hover:bg-amber-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">Subscribe</button>
              </form>
            )}
          </div>
        </div>
        {/* Contact Form */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Send a Message</h2>
          {sent ? (
            <div className="bg-green-50 text-green-700 rounded-xl p-6 text-center">
              <p className="font-semibold text-lg mb-1">Message sent!</p>
              <p className="text-sm">We will get back to you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name &amp; Company</label>
                <input type="text" required value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="First Last — Company"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info</label>
                <input type="text" required value={form.contact} onChange={e => setForm(p => ({...p, contact: e.target.value}))} placeholder="Phone, Email"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select required value={form.subject} onChange={e => setForm(p => ({...p, subject: e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="">Select a subject</option>
                  <option>Application</option>
                  <option>Inquiry</option>
                  <option>Partnership</option>
                  <option>General</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea rows={4} required value={form.message} onChange={e => setForm(p => ({...p, message: e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <button type="submit" className="w-full bg-amber-400 hover:bg-amber-500 text-white font-semibold py-2.5 rounded-lg transition-colors">Send Message</button>
            </form>
          )}
        </div>
      </section>
      <footer className="mt-auto py-8 px-6 text-center text-gray-400 text-sm border-t border-gray-100">
        © {new Date().getFullYear()} Soul Shine Community Outreach Foundation
      </footer>
    </div>
  )
}
