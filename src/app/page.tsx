import { SiteHeader } from "@/components/site-header";
import { VoiceStudio } from "@/components/voice-studio";
import { AppStoreProvider } from "@/lib/use-app-store";

export default function Page() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1400px] px-3 py-5 sm:px-6 sm:py-6">
        <AppStoreProvider>
          <VoiceStudio />
        </AppStoreProvider>
        <footer className="mt-8 text-center text-xs text-muted-foreground">
          S2 Voice Studio · 本地优先 WebUI · 所有 Fish Audio 调用经服务端代理，API Key 不会暴露到浏览器。
        </footer>
      </main>
    </div>
  );
}
