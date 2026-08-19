import { describe, expect, it } from 'vitest'
import { sanitizeBlogHtml } from '../sanitize-html'

describe('sanitizeBlogHtml', () => {
  it('strips Word/Office artifacts pasted from a rich text editor', () => {
    const wordPollutedHtml = `
      <p class="MsoNormal" style="margin:0cm;font-size:11.0pt;font-family:Aptos">
        <font face="Aptos" size="3">Some intro text</font>
        <o:p></o:p>
      </p>
      <div xmlns:o="urn:schemas-microsoft-com:office:office">
        <u1:p>Namespaced office content</u1:p>
      </div>
      <p style="--tw-border-spacing-x: 0; --tw-border-spacing-y: 0; font-family: 'Times New Roman', serif;">
        Second paragraph with <strong>bold</strong> and <em>italic</em> text.
      </p>
    `

    const result = sanitizeBlogHtml(wordPollutedHtml)

    expect(result).not.toContain('MsoNormal')
    expect(result).not.toContain('<o:p')
    expect(result).not.toContain('<u1:p')
    expect(result).not.toContain('<font')
    expect(result).not.toContain('Aptos')
    expect(result).not.toContain('--tw-')
    expect(result).not.toContain('Times New Roman')
    expect(result).not.toContain('xmlns:o')
    expect(result).not.toContain('style=')
    expect(result).toContain('<strong>bold</strong>')
    expect(result).toContain('<em>italic</em>')
  })

  it('strips inline <style> blocks injected mid-content', () => {
    const html = `
      <section class="tags">
        <style>.MsoNormal { color: red; }</style>
        <p>Legit paragraph</p>
      </section>
    `

    const result = sanitizeBlogHtml(html)

    expect(result).not.toContain('<style')
    expect(result).not.toContain('MsoNormal')
    expect(result).toContain('Legit paragraph')
  })

  it('flattens nested <p> tags into sibling paragraphs', () => {
    const html = `<p style="margin:0">Outer text <p class="MsoNormal">Inner text</p> trailing</p>`

    const result = sanitizeBlogHtml(html)

    expect(result).not.toMatch(/<p[^>]*>[^<]*<p[^>]*>/)
    expect(result).toContain('Outer text')
    expect(result).toContain('Inner text')
    expect(result).toContain('trailing')
  })

  it('keeps allowlisted semantic tags and attributes', () => {
    const html = `
      <article>
        <header>
          <h1>Title</h1>
          <span class="article-meta">By Author</span>
        </header>
        <p class="article-intro">Intro text</p>
        <a href="/series/vintage" rel="tag" class="series-label">Vintage</a>
        <figure>
          <img src="https://example.com/a.jpg" alt="An image">
          <figcaption>Caption</figcaption>
        </figure>
        <time datetime="2026-08-19">August 19, 2026</time>
        <ul><li>Item one</li></ul>
      </article>
    `

    const result = sanitizeBlogHtml(html)

    expect(result).toContain('<h1>Title</h1>')
    expect(result).toContain('class="article-meta"')
    expect(result).toContain('class="article-intro"')
    expect(result).toContain('href="/series/vintage"')
    expect(result).toContain('class="series-label"')
    expect(result).toContain('rel="tag"')
    expect(result).toContain('src="https://example.com/a.jpg"')
    expect(result).toContain('alt="An image"')
    expect(result).toContain('datetime="2026-08-19"')
    expect(result).toContain('<li>Item one</li>')
  })

  it('drops classes not in the allowlist', () => {
    const html = `<div class="MsoNormal article-meta some-random-class">content</div>`

    const result = sanitizeBlogHtml(html)

    expect(result).not.toContain('MsoNormal')
    expect(result).not.toContain('some-random-class')
    expect(result).toContain('article-meta')
  })

  it('removes disallowed tags like script entirely, including their content', () => {
    const html = `<p>Safe</p><script>alert('xss')</script>`

    const result = sanitizeBlogHtml(html)

    expect(result).not.toContain('<script')
    expect(result).not.toContain('alert')
    expect(result).toContain('Safe')
  })

  it('returns an empty string for empty input', () => {
    expect(sanitizeBlogHtml('')).toBe('')
  })

  it('preserves <br> line breaks used to add visual spacing between paragraphs', () => {
    const html = '<p>First paragraph</p><br/><br/><p>Last paragraph</p>'

    const result = sanitizeBlogHtml(html)

    expect(result).toContain('<br')
    expect(result).toContain('First paragraph')
    expect(result).toContain('Last paragraph')
  })

  it('keeps tags-list markup as classed elements, not inline-styled bullet lists', () => {
    const html = `
      <section class="tags">
        <h2>Tags</h2>
        <ul class="tags-list">
          <li><a href="/blog/tags/vintage" rel="tag" class="tag-link">Vintage</a></li>
          <li><a href="/blog/tags/luxury" rel="tag" class="tag-link">Luxury</a></li>
        </ul>
      </section>
    `

    const result = sanitizeBlogHtml(html)

    expect(result).toContain('class="tags"')
    expect(result).toContain('class="tags-list"')
    expect(result).toContain('class="tag-link"')
    expect(result).toContain('rel="tag"')
    expect(result).not.toContain('style=')
  })

  it('normalizes <b>/<i> from execCommand into <strong>/<em> instead of stripping them', () => {
    const html = '<p><b>bold text</b> and <i>italic text</i></p>'

    const result = sanitizeBlogHtml(html)

    expect(result).toContain('<strong>bold text</strong>')
    expect(result).toContain('<em>italic text</em>')
    expect(result).not.toContain('<b>')
    expect(result).not.toContain('<i>')
  })

  it('keeps YouTube embeds from the video section type', () => {
    const html = `<figure class="video"><iframe width="560" height="315" src="https://www.youtube.com/embed/abc123" frameborder="0" allowfullscreen></iframe><figcaption>Watch</figcaption></figure>`

    const result = sanitizeBlogHtml(html)

    expect(result).toContain('<iframe')
    expect(result).toContain('src="https://www.youtube.com/embed/abc123"')
    expect(result).toContain('class="video"')
  })

  it('strips iframes from non-YouTube hosts', () => {
    const html = `<iframe src="https://evil.example.com/x"></iframe>`

    const result = sanitizeBlogHtml(html)

    expect(result).not.toContain('evil.example.com')
  })

  it('migrates legacy inline-styled tags markup to the class-based format', () => {
    const legacyHtml = `
      <section class="tags" style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #eaeaea;">
        <h2 style="font-size: 1.25rem;">Tags</h2>
        <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 0.25rem;">
          <li><a href="/blog/tags/vintage" rel="tag" style="display: inline-block; background-color: #f0f0f0; border-radius: 9999px;">
            Vintage
            <style>
              @media (prefers-color-scheme: dark) {
                a[rel="tag"] { background-color: #374151; }
              }
            </style>
          </a></li>
        </ul>
      </section>
    `

    const result = sanitizeBlogHtml(legacyHtml)

    expect(result).not.toContain('style=')
    expect(result).not.toContain('<style')
    expect(result).not.toContain('@media')
    expect(result).not.toContain('prefers-color-scheme')
    expect(result).toContain('class="tags"')
    expect(result).toContain('Vintage')
    expect(result).toContain('rel="tag"')
    expect(result).toContain('href="/blog/tags/vintage"')
  })
})
