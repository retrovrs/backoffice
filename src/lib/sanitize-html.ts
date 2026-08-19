import sanitizeHtml from 'sanitize-html'

const ALLOWED_CLASSES = [
  'article-meta',
  'article-intro',
  'series-label',
  'tags',
  'tags-list',
  'tag-link',
  'author',
  'category-badge',
]

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'article',
    'header',
    'section',
    'h1',
    'h2',
    'h3',
    'p',
    'ul',
    'ol',
    'li',
    'strong',
    'em',
    'a',
    'figure',
    'figcaption',
    'img',
    'time',
    'span',
    'div',
    'iframe',
    'video',
    'br',
  ],
  allowedAttributes: {
    a: ['href', 'rel', 'class'],
    img: ['src', 'alt'],
    time: ['datetime'],
    div: ['class'],
    span: ['class'],
    p: ['class'],
    figure: ['class'],
    section: ['class'],
    ul: ['class'],
    iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen'],
    video: ['src', 'controls'],
  },
  allowedClasses: {
    div: ALLOWED_CLASSES,
    span: ALLOWED_CLASSES,
    a: ALLOWED_CLASSES,
    p: ALLOWED_CLASSES,
    section: ALLOWED_CLASSES,
    ul: ALLOWED_CLASSES,
    figure: ['video'],
  },
  allowedIframeHostnames: ['www.youtube.com', 'youtube.com'],
  // Any namespaced/prefixed tag (o:p, u1:p, w:sdt, ...) is dropped along with its content.
  exclusiveFilter: (frame) => /:/.test(frame.tag),
  disallowedTagsMode: 'discard',
  // document.execCommand('bold'/'italic') in the rich text editor emits <b>/<i>,
  // not the semantic <strong>/<em> the rest of the pipeline uses — normalize them
  // instead of letting them fall through the allowlist and get stripped.
  transformTags: {
    b: 'strong',
    i: 'em',
  },
}

/**
 * Word/Google Docs paste can flatten a <p> inside another <p>, which browsers
 * treat as two adjacent paragraphs by auto-closing the outer one early. We
 * make that behavior explicit and valid: split the outer <p> at the point the
 * inner one starts, so `<p>A<p>B</p>C</p>` becomes `<p>A</p><p>B</p><p>C</p>`.
 */
function flattenNestedParagraphs(html: string): string {
  let previous: string
  let current = html
  const nestedParagraph = /<p\b([^>]*)>((?:(?!<\/?p\b)[\s\S])*)<p\b[^>]*>([\s\S]*?)<\/p>([\s\S]*?)<\/p>/i

  do {
    previous = current
    current = current.replace(nestedParagraph, (_match, outerAttrs, before, inner, after) => {
      const openOuter = `<p${outerAttrs}>`
      const parts = [before.trim() ? `${openOuter}${before}</p>` : '', `<p>${inner}</p>`, after.trim() ? `${openOuter}${after}</p>` : '']
      return parts.filter(Boolean).join('')
    })
  } while (current !== previous)

  return current
}

export function sanitizeBlogHtml(html: string): string {
  if (!html) return html

  const flattened = flattenNestedParagraphs(html)
  return sanitizeHtml(flattened, SANITIZE_OPTIONS).trim()
}
