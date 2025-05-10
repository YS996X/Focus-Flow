import { AppProps } from 'next/app';
import { useEffect } from 'react';
import WallpaperProvider from '@/components/wallpaper-provider';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <WallpaperProvider />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp; 