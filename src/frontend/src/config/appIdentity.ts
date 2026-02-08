// Configuration module that resolves the backend canister principal from environment variables
// and derives the account identifier client-side

import { principalToAccountIdentifier } from '../lib/accountId';

// Try multiple common environment variable keys for the backend canister ID
const BACKEND_CANISTER_ID = 
  import.meta.env.VITE_BACKEND_CANISTER_ID ||
  import.meta.env.VITE_CANISTER_ID_BACKEND ||
  import.meta.env.CANISTER_ID_BACKEND ||
  import.meta.env.BACKEND_CANISTER_ID ||
  '';

console.log('🔍 Environment variables check:');
console.log('  VITE_BACKEND_CANISTER_ID:', import.meta.env.VITE_BACKEND_CANISTER_ID);
console.log('  VITE_CANISTER_ID_BACKEND:', import.meta.env.VITE_CANISTER_ID_BACKEND);
console.log('  CANISTER_ID_BACKEND:', import.meta.env.CANISTER_ID_BACKEND);
console.log('  BACKEND_CANISTER_ID:', import.meta.env.BACKEND_CANISTER_ID);
console.log('  Resolved BACKEND_CANISTER_ID:', BACKEND_CANISTER_ID);

export const APP_PRINCIPAL = BACKEND_CANISTER_ID;

// Derive the account identifier from the principal
export const APP_ACCOUNT_ID = BACKEND_CANISTER_ID 
  ? principalToAccountIdentifier(BACKEND_CANISTER_ID)
  : '';

console.log('📋 App Identity:');
console.log('  Principal:', APP_PRINCIPAL);
console.log('  Account ID:', APP_ACCOUNT_ID);
