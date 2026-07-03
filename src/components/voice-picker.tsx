"use client";

import * as React from "react";
import { Search, Star, Copy, Check, AudioLines, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, copyToClipboard } from "@/lib/utils";
import { DEFAULT_VOICES } from "@/lib/constants";
import { fetchModels } from "@/lib/api-client";
import type { VoiceModel } from "@/lib/types";
import { useAppStore } from "@/lib/use-app-store";

interface VoicePickerProps {
  value: string;
  onChange: (id: string) => void;
}

type TabKey = "default" | "manual" | "library" | "mine" | "favorites";

export function VoicePicker({ value, onChange }: VoicePickerProps) {
  const [tab, setTab] = React.useState<TabKey>("default");
  const [manualId, setManualId] = React.useState(value);
  React.useEffect(() => setManualId(value), [value]);
  const store = useAppStore();

  return (
    <div className="space-y-2">
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="default" className="text-xs">默认</TabsTrigger>
          <TabsTrigger value="manual" className="text-xs">手动</TabsTrigger>
          <TabsTrigger value="library" className="text-xs">模型库</TabsTrigger>
          <TabsTrigger value="mine" className="text-xs">我的</TabsTrigger>
          <TabsTrigger value="favorites" className="text-xs">收藏</TabsTrigger>
        </TabsList>

        <TabsContent value="default" className="mt-2">
          <ScrollArea className="h-56 rounded-md border">
            <div className="grid grid-cols-1 gap-1 p-2 sm:grid-cols-2">
              {DEFAULT_VOICES.map((v) => (
                <VoiceRow
                  key={v.id}
                  id={v.id}
                  title={v.title}
                  selected={value === v.id}
                  onSelect={onChange}
                  lang={v.lang}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="manual" className="mt-2">
          <div className="flex gap-2">
            <Input
              placeholder="输入 reference_id (model id)"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
            />
            <Button
              onClick={() => {
                if (manualId.trim()) {
                  onChange(manualId.trim());
                  toast.success("已设置 reference_id");
                }
              }}
            >
              设为当前
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            高级模式可传入多个 reference_id 数组（多说话人）。OpenAPI 标注多说话人主要面向 s2-pro，对 s2.1-pro-free 需实测兼容性。
          </p>
        </TabsContent>

        <TabsContent value="library" className="mt-2">
          <ModelBrowser self={false} value={value} onChange={onChange} />
        </TabsContent>

        <TabsContent value="mine" className="mt-2">
          <ModelBrowser self value={value} onChange={onChange} />
        </TabsContent>

        <TabsContent value="favorites" className="mt-2">
          <ScrollArea className="h-56 rounded-md border">
            <div className="p-2">
              {store.favorites.length === 0 ? (
                <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                  还没有收藏的声音。在模型库点击 ☆ 收藏。
                </p>
              ) : (
                store.favorites.map((f) => (
                  <VoiceRow
                    key={f.id}
                    id={f.id}
                    title={f.title || f.id}
                    selected={value === f.id}
                    onSelect={onChange}
                    favorite
                    onUnfavorite={() => store.removeFavorite(f.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {value && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-2 py-1.5">
          <AudioLines className="h-3.5 w-3.5 text-primary" />
          <span className="truncate text-xs text-muted-foreground">当前 voice:</span>
          <code className="truncate text-xs font-mono">{value}</code>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-6 w-6"
            onClick={() => copyToClipboard(value).then(() => toast.success("已复制"))}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

function VoiceRow({
  id,
  title,
  selected,
  onSelect,
  lang,
  favorite,
  onUnfavorite,
}: {
  id: string;
  title: string;
  selected: boolean;
  onSelect: (id: string) => void;
  lang?: string;
  favorite?: boolean;
  onUnfavorite?: () => void;
}) {
  const [copied, setCopied] = React.useState(false);
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm transition-colors",
        selected ? "border-primary bg-primary/10" : "hover:bg-accent",
      )}
    >
      <button
        type="button"
        className="flex flex-1 items-center gap-2 truncate text-left"
        onClick={() => onSelect(id)}
      >
        <User className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="truncate">{title}</span>
        {lang && (
          <Badge variant="secondary" className="ml-1 text-[10px]">
            {lang}
          </Badge>
        )}
      </button>
      <button
        type="button"
        className="rounded p-1 hover:bg-accent"
        onClick={() => {
          copyToClipboard(id).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 800);
          });
        }}
        aria-label="复制 id"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </button>
      {favorite ? (
        <button
          type="button"
          className="rounded p-1 hover:bg-accent"
          onClick={onUnfavorite}
          aria-label="取消收藏"
        >
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
        </button>
      ) : null}
    </div>
  );
}

function ModelBrowser({
  self,
  value,
  onChange,
}: {
  self: boolean;
  value: string;
  onChange: (id: string) => void;
}) {
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<VoiceModel[]>([]);
  const [err, setErr] = React.useState<string | null>(null);
  const store = useAppStore();

  const run = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetchModels({
        self,
        title: q || undefined,
        page_size: 30,
        sort_by: self ? "created_at" : "score",
      });
      setItems(res.items);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [q, self]);

  React.useEffect(() => {
    const t = setTimeout(run, 300);
    return () => clearTimeout(t);
  }, [run]);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="按 title 搜索"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="icon" onClick={run} disabled={loading}>
          <Search className="h-4 w-4" />
        </Button>
      </div>
      {err && (
        <p className="rounded-md border border-destructive/50 bg-destructive/5 px-2 py-1.5 text-xs text-destructive">
          {err}
        </p>
      )}
      <ScrollArea className="h-56 rounded-md border">
        <div className="p-2">
          {loading ? (
            <div className="space-y-2 p-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              没有匹配的模型
            </p>
          ) : (
            items.map((m) => (
              <ModelCardMini
                key={m._id}
                model={m}
                selected={value === m._id}
                onSelect={onChange}
                onFavorite={() =>
                  store.isFavorite(m._id)
                    ? store.removeFavorite(m._id)
                    : store.addFavorite({ id: m._id, title: m.title })
                }
                isFavorite={store.isFavorite(m._id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function ModelCardMini({
  model,
  selected,
  onSelect,
  onFavorite,
  isFavorite,
}: {
  model: VoiceModel;
  selected: boolean;
  onSelect: (id: string) => void;
  onFavorite: () => void;
  isFavorite: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-1 flex items-center gap-2 rounded-md border px-2 py-1.5",
        selected ? "border-primary bg-primary/10" : "hover:bg-accent",
      )}
    >
      <button
        type="button"
        className="flex flex-1 flex-col items-start gap-0.5 truncate text-left"
        onClick={() => onSelect(model._id)}
      >
        <span className="flex w-full items-center gap-1.5 truncate text-sm">
          <span className="truncate">{model.title}</span>
          {model.visibility && (
            <Badge variant="outline" className="text-[10px]">
              {model.visibility}
            </Badge>
          )}
        </span>
        <span className="flex w-full items-center gap-2 text-[11px] text-muted-foreground">
          <span className="truncate font-mono">{model._id}</span>
          {typeof model.task_count === "number" && <span>· {model.task_count} tasks</span>}
          {typeof model.like_count === "number" && <span>· ♥ {model.like_count}</span>}
        </span>
      </button>
      <button
        type="button"
        className="rounded p-1 hover:bg-accent"
        onClick={onFavorite}
        aria-label="收藏"
      >
        <Star
          className={cn(
            "h-3.5 w-3.5",
            isFavorite && "fill-amber-400 text-amber-400",
          )}
        />
      </button>
    </div>
  );
}
