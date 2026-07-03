"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TtsWorkbench } from "./tts-workbench";
import { VoiceManagementPanel } from "./voice-management-panel";
import { VoiceDesignPanel } from "./voice-design-panel";
import { AsrPanel } from "./asr-panel";
import { useLocalState } from "@/lib/use-local-state";

const NAV = [
  { value: "workbench", label: "TTS 工作台" },
  { value: "voices", label: "声音管理" },
  { value: "voice-design", label: "Voice Design" },
  { value: "asr", label: "ASR" },
] as const;

export function VoiceStudio() {
  const [tab, setTab] = useLocalState<string>("vs-tab", "workbench");
  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-4">
        {NAV.map((n) => (
          <TabsTrigger key={n.value} value={n.value} className="text-xs sm:text-sm">
            {n.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="workbench" className="mt-4">
        <TtsWorkbench />
      </TabsContent>
      <TabsContent value="voices" className="mt-4">
        <VoiceManagementPanel />
      </TabsContent>
      <TabsContent value="voice-design" className="mt-4">
        <VoiceDesignPanel />
      </TabsContent>
      <TabsContent value="asr" className="mt-4">
        <AsrPanel />
      </TabsContent>
    </Tabs>
  );
}
