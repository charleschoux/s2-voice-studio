"use client";

import * as React from "react";
import { AudioLines, RefreshCw, Settings2, Sparkles } from "lucide-react";
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
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <AudioLines className="h-4 w-4" />
          </span>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-semibold tracking-tight">S2 Voice Studio</span>
            <span className="text-[10px] text-muted-foreground">Fish Audio Console</span>
          </div>
        </div>

        <Badge variant="soft" className="ml-1 hidden md:inline-flex">
          Fish Audio · s2.1-pro-free
        </Badge>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 shadow-xs">
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
                variant="soft"
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
        </div>
      </div>
    </header>
  );
}
