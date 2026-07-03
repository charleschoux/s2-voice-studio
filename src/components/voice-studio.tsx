"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TtsWorkbench } from "./tts-workbench";
import { VoiceManagementPanel } from "./voice-management-panel";
import { VoiceDesignPanel } from "./voice-design-panel";
import { AsrPanel } from "./asr-panel";
import { useLocalState } from "@/lib/use-local-state";

export function VoiceStudio() {
  const [tab, setTab] = useLocalState<string>("vs-tab", "workbench");
  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-4">
        <TabsTrigger value="workbench" className="text-xs sm:text-sm">TTS 工作台</TabsTrigger>
        <TabsTrigger value="voices" className="text-xs sm:text-sm">声音管理</TabsTrigger>
        <TabsTrigger value="voice-design" className="text-xs sm:text-sm">Voice Design</TabsTrigger>
        <TabsTrigger value="asr" className="text-xs sm:text-sm">ASR</TabsTrigger>
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
