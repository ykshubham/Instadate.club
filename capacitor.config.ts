import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.instadate.club',
  appName: 'Instadate',
  webDir: 'dist',
  server: {
    // Production: load app from the deployed Cloudflare Worker
    url: 'https://instadateclub.heyshubham1323.workers.dev',
    cleartext: false,
    // Keep Google OAuth inside the WebView instead of opening Chrome
    allowNavigation: ['accounts.google.com'],
    // For local development, comment out the url above and use:
    // url: 'http://10.0.2.2:5173',
    // cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
