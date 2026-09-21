import { NasLogo } from './NasLogo'

const footerNav = [
  { label: 'Home', href: '/' },
  { label: 'Programs', href: '/programs' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Camps', href: '/camps' },
  { label: 'Art Parties', href: '/art-parties' },
  { label: 'Become a Teacher', href: '/become-a-teacher' },
  { label: 'In class Workshops', href: '/workshops' },
  { label: 'Contact', href: '/contact' },
  { label: 'Register', href: '/register' },
]

export default function SiteFooter() {
  return (
    <footer className="bg-black text-white">
      <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-10 px-12 py-12">
        {/* Logo column */}
        <div className="flex items-start">
          <div className="bg-white rounded-full p-1">
            <NasLogo size={96} />
          </div>
        </div>

        {/* Navigator */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
            Navigator
          </h4>
          <ul className="space-y-2">
            {footerNav.map((item, idx) => (
              <li key={`${item.href}-${item.label}-${idx}`}>
                <a
                  href={item.href}
                  className="text-xs text-gray-300 hover:text-white transition-colors"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
            Contact Us
          </h4>
          <address className="not-italic space-y-2">
            <p className="text-xs text-gray-300">Metro Vancouver, BC</p>
            <a
              href="tel:6041234567"
              className="block text-xs text-gray-300 hover:text-white transition-colors"
            >
              (604) 123-4567
            </a>
            <a
              href="mailto:hello@neighbourhoodartstudios.com"
              className="block text-xs text-gray-300 hover:text-white transition-colors break-all"
            >
              hello@neighbourhoodartstudios.com
            </a>
          </address>
        </div>

        {/* Social */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
            Connect With Us
          </h4>
          <ul className="space-y-2">
            {[
              { label: 'Facebook', href: 'https://facebook.com' },
              { label: 'Twitter', href: 'https://twitter.com' },
              { label: 'Instagram', href: 'https://instagram.com' },
            ].map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-300 hover:text-white transition-colors"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 px-12 py-3 flex items-center justify-between">
        <p className="text-[10px] text-gray-600">
          Designed by CodeTactic Media Co | Web Design | All rights reserved
        </p>
        <p className="text-[10px] text-gray-600">
          © {new Date().getFullYear()} Neighbourhood Art Studios
        </p>
      </div>
    </footer>
  )
}
