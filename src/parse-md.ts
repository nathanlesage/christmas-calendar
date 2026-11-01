export interface MarkdownContents {
  /**
   * Reviewed album
   */
  album: string
  /**
   * Reviewed artist
   */
  artist: string
  /**
   * Link to cover image
   */
  cover_link: string
  /**
   * Release year
   */
  release_date: string
  /**
   * Genre
   */
  genre: string
  /**
   * Favorite song (may include honorable mentions)
   */
  favorite: string
  /**
   * Rating (0-10)
   */
  rating: string
  /**
   * Bandcamp link
   */
  link: string
  /**
   * The actual review.
   */
  review: string
  /**
   * Allow arbitrary additional attributes
   */
  [key: string]: string
}

/**
 * Validates a record to conform with our Markdown contents interface.
 *
 * @param   {Record}  frontmatter  The potentially arbitrary record
 *
 * @return  {boolean}              Whether it conforms to the interface
 */
function validateAttributes (frontmatter: Record<string, string>): frontmatter is MarkdownContents {
  if (typeof frontmatter.album !== 'string') {
    return false
  }
  if (typeof frontmatter.artist !== 'string') {
    return false
  }
  if (typeof frontmatter.cover_link !== 'string') {
    return false
  }
  if (typeof frontmatter.release_date !== 'string') {
    return false
  }
  if (typeof frontmatter.genre !== 'string') {
    return false
  }
  if (typeof frontmatter.favorite !== 'string') {
    return false
  }
  if (typeof frontmatter.rating !== 'string') {
    return false
  }
  if (typeof frontmatter.link !== 'string') {
    return false
  }

  return true
}

/**
 * Super simple Markdown parser that does the basics of parsing.
 *
 * @return  {MarkdownContents}  The parsed contents
 */
export function parseMarkdown (md: string): MarkdownContents {
  const lines = md.split('\n')

  let frontmatterEnd = 1

  while (lines[frontmatterEnd] !== '---' && frontmatterEnd < lines.length) {
    frontmatterEnd++
  }

  if (lines[frontmatterEnd] !== '---') {
    throw new Error('Could not parse Markdown file: Frontmatter is required but was not present')
  }

  const frontmatterAttributes: Record<string, string> = Object.fromEntries(
    // Extract only the frontmatter contents, split them on the colon, and turn
    // it into a record. Assumes no multiline attributes, again this is super
    // simple.
    lines.slice(1, frontmatterEnd).map(line => {
      const [firstComponent, ...remainder] = line.split(':')
      return [firstComponent.trim(), remainder.join(':').trim()]
    })
  )

  if (!validateAttributes(frontmatterAttributes)) {
    throw new Error('Could not parse Markdown: Invalid frontmatter')
  }

  let review = lines.slice(frontmatterEnd + 1).join('\n').trim()

  // Turn linebreaks into visible line breaks
  review = review.replaceAll('\n', '<br />')

  // Emphasis
  review = review.replaceAll(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  review = review.replaceAll(/\*(.+?)\*/g, '<em>$1</em>')

  // Links
  review = review.replaceAll(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')

  // Actually assign the review
  frontmatterAttributes.review = review
  return frontmatterAttributes
}
