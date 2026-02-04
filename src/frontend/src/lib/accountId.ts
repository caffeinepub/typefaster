import { Principal } from '@dfinity/principal';

// Account identifier generation for ICP
// Based on the Internet Computer specification for account identifiers

const ACCOUNT_DOMAIN_SEPARATOR = '\x0Aaccount-id';
const SUB_ACCOUNT_ZERO = new Uint8Array(32);

/**
 * Converts a Principal to an ICP Account Identifier
 * Uses SHA-224 hash with CRC32 checksum as per ICP specification
 */
export async function principalToAccountIdentifier(
  principal: Principal,
  subAccount?: Uint8Array
): Promise<string> {
  const subAcc = subAccount || SUB_ACCOUNT_ZERO;

  // Create the hash input: domain separator + principal bytes + subaccount
  const principalBytes = principal.toUint8Array();
  const hashInput = new Uint8Array(
    ACCOUNT_DOMAIN_SEPARATOR.length + principalBytes.length + subAcc.length
  );

  let offset = 0;
  for (let i = 0; i < ACCOUNT_DOMAIN_SEPARATOR.length; i++) {
    hashInput[offset++] = ACCOUNT_DOMAIN_SEPARATOR.charCodeAt(i);
  }
  hashInput.set(principalBytes, offset);
  offset += principalBytes.length;
  hashInput.set(subAcc, offset);

  // Compute SHA-224 hash using SHA-256 and truncating to 28 bytes
  const hashBytes = await sha224(hashInput);

  // Compute CRC32 checksum
  const crc = crc32(hashBytes);

  // Combine CRC32 (4 bytes) + hash (28 bytes) = 32 bytes total
  const accountId = new Uint8Array(32);
  accountId.set(crc, 0);
  accountId.set(hashBytes, 4);

  // Convert to hex string
  return toHexString(accountId);
}

/**
 * SHA-224 implementation using Web Crypto API
 * SHA-224 is SHA-256 truncated to 224 bits (28 bytes)
 */
async function sha224(data: Uint8Array): Promise<Uint8Array> {
  // Create a new buffer to ensure proper type compatibility
  const buffer = new ArrayBuffer(data.length);
  const view = new Uint8Array(buffer);
  view.set(data);
  
  // Use SHA-256 and truncate to 28 bytes for SHA-224
  const hashBuffer = await crypto.subtle.digest('SHA-256', view);
  const hashArray = new Uint8Array(hashBuffer);
  // SHA-224 is the first 28 bytes of SHA-256
  return hashArray.slice(0, 28);
}

/**
 * CRC32 implementation for account identifier checksum
 */
function crc32(bytes: Uint8Array): Uint8Array {
  const table = makeCrc32Table();
  let crc = 0xffffffff;

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    const index = (crc ^ byte) & 0xff;
    crc = (crc >>> 8) ^ table[index];
  }

  crc = crc ^ 0xffffffff;

  // Convert to big-endian 4-byte array
  const result = new Uint8Array(4);
  result[0] = (crc >> 24) & 0xff;
  result[1] = (crc >> 16) & 0xff;
  result[2] = (crc >> 8) & 0xff;
  result[3] = crc & 0xff;

  return result;
}

/**
 * Generate CRC32 lookup table
 */
function makeCrc32Table(): Uint32Array {
  const table = new Uint32Array(256);

  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[i] = c;
  }

  return table;
}

/**
 * Convert byte array to hex string
 */
function toHexString(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
