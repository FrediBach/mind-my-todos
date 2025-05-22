import type { AppProps } from 'next/app'
import '../styles/globals.css';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/ThemeProvider';
import { TextSizeProvider } from '@/components/TextSizeProvider';
import { TimeTrackingProvider } from '@/contexts/TimeTrackingContext';
import { LlmProvider } from '@/contexts/LlmContext';
import { ConfigProvider } from '@/contexts/ConfigContext';
import { Footer } from '@/components/Footer';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ConfigProvider>
      <ThemeProvider defaultTheme="dark">
        <TextSizeProvider defaultSize="medium">
          <TimeTrackingProvider>
            <LlmProvider>
              <div className="min-h-screen flex flex-col">
                <Component {...pageProps} />
                <Footer />
                <Toaster />
              </div>
            </LlmProvider>
          </TimeTrackingProvider>
        </TextSizeProvider>
      </ThemeProvider>
    </ConfigProvider>
  )
}