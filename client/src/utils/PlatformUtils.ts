/**
 * Detects if the host is running on Windows.
 */
 export function isWindows() {
  return navigator.userAgent.match(/Windows/i)
}

/**
 * Detects if the host is running on MacOS.
 */
export function isMacOS() {
  return navigator.userAgent.match(/Macintosh/i)
}