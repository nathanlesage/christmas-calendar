// Taken from Vite's `base` config. Can be undefined
const BASE_URL = import.meta.env.BASE_URL

export function absUrl (url: string): string {
  try {
    // If the URL constructor doesn't throw an error, the URL is complete and
    // can be returned as is.
    new URL(url)
    return url
  } catch (err: unknown) {
    // Silent fall through
  }

  if (url.startsWith('/')) {
    // Path-absolute URL -> attach to the BASE_URL
    return (BASE_URL + url).replaceAll('//', '/')
  }
  return url
}
