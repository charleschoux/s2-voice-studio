"use client";

import * as React from "react";
import { AudioLines, Github, RefreshCw, Settings2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useHealth } from "@/lib/use-health";
import { FISH_DOCS_LINKS } from "@/lib/constants";

export function SiteHeader() {
  const health = useHealth();
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-14 items-center gap-2 px-3 sm:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <AudioLines className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">S2 Voice Studio</span>
        </div>
        <Badge variant="outline" className="ml-1 hidden md:inline-flex">
          Fish Audio · s2.1-pro-free
        </Badge>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 rounded-md border px-2 py-1">
            <Label htmlFor="mock-switch" className="text-xs text-muted-foreground">
              Mock
            </Label>
            <Switch
              id="mock-switch"
              checked={health.mock}
              onCheckedChange={health.setMock}
            />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={health.refresh}
                aria-label="Refresh API status"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {health.loaded ? (health.hasApiKey ? "API Ready" : "No Key") : "…"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {health.hasApiKey
                ? `已配置 FISH_API_KEY，默认模型 ${health.defaultModel}`
                : "未检测到 FISH_API_KEY，可启用 Mock 演示"}
            </TooltipContent>
          </Tooltip>
          <Button asChild variant="ghost" size="icon">
            <a href={FISH_DOCS_LINKS.openapi} target="_blank" rel="noreferrer" aria-label="Fish OpenAPI">
              <Settings2 className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild variant="ghost" size="icon">
            <a href={FISH_DOCS_LINKS.modelsOverview} target="_blank" rel="noreferrer" aria-label="Fish docs">
              <Sparkles className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild variant="ghost" size="icon">
            <a href={FISH_DOCS_LINKS.capabilities} target="_blank" rel="noreferrer" aria-label="Capabilities">
              <Github className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
