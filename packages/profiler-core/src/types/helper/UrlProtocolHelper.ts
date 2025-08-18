const KNOWN_PROTOCOLS = ['file', 'webpack', 'webpack-internal'] as const

export const KNOWN_URL_PROTOCOLS = new Set<UrlProtocols>(KNOWN_PROTOCOLS)

export type UrlProtocols = typeof KNOWN_PROTOCOLS[number]