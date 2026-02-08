import { Principal } from '@dfinity/principal';
import { principalToAccountIdentifier } from '../lib/accountId';

/**
 * IC-native app identity configuration
 * Reads the canister ID from deployment-time environment variables
 * and derives the account identifier client-side
 */

/**
 * Get the app canister principal from Vite environment
 * Checks multiple common environment variable keys used by dfx/Vite
 * Returns null if not available or invalid
 */
export function getAppCanisterPrincipal(): Principal | null {
  // List of environment variable keys to check (in priority order)
  const envKeys = [
    'VITE_BACKEND_CANISTER_ID',
    'VITE_CANISTER_ID_BACKEND',
    'CANISTER_ID_BACKEND',
    'BACKEND_CANISTER_ID',
  ];

  const checkedKeys: string[] = [];
  const invalidValues: Array<{ key: string; value: string }> = [];

  for (const key of envKeys) {
    const value = import.meta.env[key];
    checkedKeys.push(key);

    if (value) {
      try {
        const principal = Principal.fromText(value);
        console.log(`✓ Resolved backend canister principal from ${key}:`, principal.toString());
        return principal;
      } catch (error) {
        invalidValues.push({ key, value });
        console.warn(`✗ Invalid principal value in ${key}:`, value, error);
      }
    }
  }

  // Log a clear warning if no valid principal was found
  console.warn(
    '⚠️ Could not resolve backend canister principal ID.',
    '\nChecked environment keys:', checkedKeys.join(', '),
    invalidValues.length > 0 ? `\nInvalid values found: ${JSON.stringify(invalidValues)}` : '\nNo values found in any checked keys.'
  );

  return null;
}

/**
 * Get the app canister principal as a string
 * Returns "Not available" if not found or invalid
 */
export function getAppCanisterPrincipalString(): string {
  const principal = getAppCanisterPrincipal();
  return principal ? principal.toString() : 'Not available';
}

/**
 * Derive the app canister account identifier from its principal
 * Returns null if principal is not available or derivation fails
 */
export async function getAppCanisterAccountId(): Promise<string | null> {
  try {
    const principal = getAppCanisterPrincipal();
    if (!principal) {
      return null;
    }
    return await principalToAccountIdentifier(principal);
  } catch (error) {
    console.error('Failed to derive app canister account ID:', error);
    return null;
  }
}

/**
 * Get the app canister account identifier as a string
 * Returns "Not available" if derivation fails
 */
export async function getAppCanisterAccountIdString(): Promise<string> {
  const accountId = await getAppCanisterAccountId();
  return accountId || 'Not available';
}
