import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './Reply.css'

// Links in replies open in a new tab; tables scroll sideways on narrow screens.
const components = {
  a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
  table: ({ node, ...props }) => (
    <div className="reply-table">
      <table {...props} />
    </div>
  ),
}

// Shows one of Uma's replies with its formatting: bold, lists, headings, tables and links.
// Any raw HTML in a reply is dropped, never rendered, so replies can't inject markup into the page.
export function Reply({ text }) {
  return (
    <div className="reply">
      <Markdown remarkPlugins={[remarkGfm]} components={components} skipHtml>
        {text}
      </Markdown>
    </div>
  )
}
