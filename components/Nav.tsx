"use client"
import Link from "next/link"
import { useState } from "react"

const socialLinks = [
  { label: "LinkedIn",  href: "#", icon: "in", bg: "#0A66C2", color: "#fff" },
  { label: "Facebook",  href: "#", icon: "f",  bg: "#1877F2", color: "#fff" },
  { label: "Instagram", href: "#", icon: "ig", bg: "#E1306C", color: "#fff" },
  { label: "X",         href: "#", icon: "X",  bg: "#000",    color: "#fff" },
  { label: "Discord",   href: "#", icon: "d",  bg: "#5865F2", color: "#fff" },
  { label: "Pinterest", href: "#", icon: "P",  bg: "#E60023", color: "#fff" },
  { label: "YouTube",   href: "#", icon: "Y",  bg: "#FF0000", color: "#fff" },
  { label: "WhatsApp",  href: "#", icon: "w",  bg: "#25D366", color: "#fff" },
  { label: "Threads",   href: "#", icon: "@",  bg: "#000",    color: "#fff" },
  { label: "Spotify",   href: "#", icon: "s",  bg: "#1DB954", color: "#fff" },
  { label: "Tumblr",    href: "#", icon: "t",  bg: "#35465C", color: "#fff" },
  { label: "Snapchat",  href: "#", icon: "sc", bg: "#FFFC00", color: "#000" },
  { label: "Etsy",      href: "#", icon: "E",  bg: "#F56400", color: "#fff" },
  { label: "TikTok",    href: "#", icon: "tt", bg: "#010101", color: "#fff" },
]

const services = [
  { href: "/services/business-solutions",    label: "0A. Business Solutions" },
  { href: "/services/home-utility",          label: "1A. Home Utility Services" },
  { href: "/services/financial",             label: "1B. Financial Services" },
  { href: "/services/health-wellness",       label: "1C. Health & Wellness" },
  { href: "/services/free-resources",        label: "1D. Free Resource Connections" },
  { href: "/services/educational-resources", label: "1E. Educational Resources" },
]

const navLinks = [
  { href: "/about",    label: "2. About" },
  { href: "/calendar", label: "Calendar" },
  { href: "/news",     label: "News" },
  { href: "/projects", label: "Projects" },
  { href: "/contact",  label: "Contact" },
]

export default function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 w-full">
      <div className="w-full flex items-center justify-between px-6 py-2 border-b border-gray-100">
        <Link href="/auth" className="text-sm text-gray-500 hover:text-gray-800 font-medium">Log In</Link>
        <div className="hidden sm:flex items-center gap-1.5 flex-wrap justify-end">
          {socialLinks.map(s => (
            <a key={s.label} href={s.href} aria-label={s.label}
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ backgroundColor: s.bg, color: s.color }}>
              {s.icon}
            </a>
          ))}
        </div>
      </div>
      <nav className="w-full flex items-center justify-center flex-wrap gap-1 px-4 py-3">
        <div className="relative"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}>
          <Link href="/" className="text-sm font-medium text-gray-700 hover:text-amber-500 px-3 py-2 inline-flex items-center gap-1">
            1. Home <span className="text-xs opacity-60">v</span>
          </Link>
          {open && (
            <div className="absolute top-full left-0 bg-white border border-gray-100 rounded-xl shadow-lg py-2 min-w-52 z-50">
              {services.map(s => (
                <Link key={s.href} href={s.href}
                  className="block px-4 py-2 text-sm text-gray-600 hover:bg-amber-50 hover:text-amber-600 whitespace-nowrap">
                  {s.label}
                </Link>
              ))}
            </div>
          )}
        </div>
        {navLinks.map(l => (
          <Link key={l.href} href={l.href}
            className="text-sm font-medium text-gray-700 hover:text-amber-500 px-3 py-2 whitespace-nowrap">
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
