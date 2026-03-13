/**
 * API Key Management for LaunchPad
 * Handles generation, validation, and management of API keys
 * for external integrations (e.g., YouTube Content Creator)
 */

import { createHash, randomBytes } from 'crypto'

// Key format: lp_<32 random chars>
const KEY_PREFIX = 'lp_'
const KEY_LENGTH = 32

/**
 * Generate a new API key
 * Returns both the full key (to show user once) and the hash (to store)
 */
export function generateApiKey(): { key: string; keyPrefix: string; keyHash: string } {
  const randomPart = randomBytes(KEY_LENGTH).toString('hex').slice(0, KEY_LENGTH)
  const key = `${KEY_PREFIX}${randomPart}`
  const keyPrefix = key.slice(0, 11) // lp_ + first 8 chars
  const keyHash = hashApiKey(key)

  return { key, keyPrefix, keyHash }
}

/**
 * Hash an API key for storage
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

/**
 * Validate API key format
 */
export function isValidKeyFormat(key: string): boolean {
  return key.startsWith(KEY_PREFIX) && key.length === KEY_PREFIX.length + KEY_LENGTH
}

/**
 * Available scopes for API keys
 */
export const API_SCOPES = {
  AVATARS_READ: 'avatars:read',
  AVATARS_WRITE: 'avatars:write',
  ICPS_READ: 'icps:read',
  ICPS_WRITE: 'icps:write',
  SESSIONS_READ: 'sessions:read',
} as const

export type ApiScope = (typeof API_SCOPES)[keyof typeof API_SCOPES]

/**
 * Default scopes for new API keys
 */
export const DEFAULT_SCOPES: ApiScope[] = [
  API_SCOPES.AVATARS_READ,
  API_SCOPES.ICPS_READ,
  API_SCOPES.SESSIONS_READ,
]
