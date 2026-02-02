import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.corda.app',
  appName: 'Corda',
  webDir: 'public',
  server: {
    url: 'https://cordaglobal.vercel.app',
    cleartext: true
  }
};

export default config;
