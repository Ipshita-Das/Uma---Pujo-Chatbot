import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MapPinIcon } from './Icons.jsx'
import './Reply.css'

// Google Maps URLs (no API key needed): https://developers.google.com/maps/documentation/urls/get-started
const MAPS_HOSTS = new Set(['www.google.com', 'google.com', 'maps.google.com', 'www.google.co.in', 'google.co.in'])

function isMapsLink(href = '') {
  try {
    const url = new URL(href)
    return url.protocol === 'https:' && MAPS_HOSTS.has(url.hostname) && url.pathname.startsWith('/maps')
  } catch {
    return false
  }
}

// Links in replies open in a new tab, Google Maps links become map buttons, tables scroll sideways on narrow screens.
const components = {
  a: ({ node, href, children, ...props }) =>
    isMapsLink(href) ? (
      <a {...props} href={href} className="map-link" target="_blank" rel="noopener noreferrer">
        <MapPinIcon size={18} className="map-link-icon" />
        <span>{typeof children === 'string' ? children.replace(/\+/g, ' ') : children}</span>
      </a>
    ) : (
      <a {...props} href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  table: ({ node, ...props }) => (
    <div className="reply-table">
      <table {...props} />
    </div>
  ),
}

// The model sometimes leaves spaces inside map URLs, which breaks the link; turn them into +.
const fixMapLinks = (text) =>
  text.replace(/\]\((https:\/\/www\.google\.[a-z.]+\/maps\/[^)\n]*)\)/g, (_, url) => `](${url.trim().replace(/ /g, '+')})`)

// Shows one of Uma's replies with its formatting: bold, lists, headings, tables, links and map buttons.
// Any raw HTML in a reply is dropped, never rendered, so replies can't inject markup into the page.
export function Reply({ text }) {
  return (
    <div className="reply">
      <Markdown remarkPlugins={[remarkGfm]} components={components} skipHtml>
        {fixMapLinks(text)}
      </Markdown>
    </div>
  )
}
