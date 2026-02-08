// Utility to fetch and anonymize visitor IP using ipify
export async function getAnonymizedVisitorId(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    const ip = data.ip;
    
    // Create a simple hash of the IP for anonymization
    const encoder = new TextEncoder();
    const data_encoded = encoder.encode(ip);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data_encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  } catch (error) {
    console.error('Failed to fetch visitor ID:', error);
    // Return a fallback anonymous ID
    return 'anonymous-' + Math.random().toString(36).substring(7);
  }
}
