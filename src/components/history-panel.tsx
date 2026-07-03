"use client";

import * as React from "react";
import { History, Trash2, Download, RotateCcw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAppStore } from "@/lib/use-app-store";
import { formatBytes, formatDuration, downloadBlob, slugify } from "@/lib/utils";
import { extForFormat } from "@/lib/client-media";
import type { HistoryItem } from "@/lib/types";

interface Props {
  onRestore: (item: HistoryItem) => void;
}

export function HistoryPanel({ onRestore }: Props) {
  const store = useAppStore();

  const playAudio = async (item: HistoryItem) => {
    const blob = await store.getAudio(item.id);
    if (!blob) {
      toast.error("该历史项的音频已被清理");
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = new Audio(url);
    a.play();
    a.onended = () => URL.revokeObjectURL(url);
  };

  const downloadAudio = async (item: HistoryItem) => {
    const blob = await store.getAudio(item.id);
    if (!blob) {
      toast.error("该历史项的音频已被清理");
      return;
    }
    downloadBlob(blob, `${slugify(item.text.slice(0, 24)) || "audio"}.${extForFormat(item.format)}`);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <History className="h-4 w-4 text-primary" /> 历史
          <Badge variant="secondary">{store.history.length}</Badge>
        </div>
        {store.history.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                <Trash2 className="h-3.5 w-3.5" /> 清空
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>清空所有历史？</AlertDialogTitle>
                <AlertDialogDescription>
                  这将删除浏览器中保存的全部历史记录和对应音频，无法恢复。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={() => store.wipeHistory()}>
                  确认清空
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="p-2">
          {store.history.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              还没有历史记录
            </p>
          ) : (
            store.history.map((h) => (
              <div
                key={h.id}
                className="mb-1.5 rounded-lg border border-border bg-card p-2.5 text-sm hover:bg-accent/40"
              >
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant={h.error ? "destructive" : h.mock ? "secondary" : "default"}
                    className="text-[10px]"
                  >
                    {h.mode}
                  </Badge>
                  {h.mock && <Badge variant="outline" className="text-[10px]">mock</Badge>}
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {new Date(h.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs">{h.text}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span>{h.format}</span>
                  {h.responseBytes != null && <span>· {formatBytes(h.responseBytes)}</span>}
                  {h.durationMs != null && <span>· {formatDuration(h.durationMs)}</span>}
                  {h.voiceId && <span className="truncate">· {h.voiceId}</span>}
                </div>
                {h.error && (
                  <div className="mt-1 flex items-start gap-1 text-[11px] text-destructive">
                    <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                    <span className="line-clamp-2">{h.error}</span>
                  </div>
                )}
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[11px]"
                    onClick={() => onRestore(h)}
                  >
                    <RotateCcw className="h-3 w-3" /> 还原
                  </Button>
                  {!h.error && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[11px]"
                        onClick={() => playAudio(h)}
                      >
                        播放
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[11px]"
                        onClick={() => downloadAudio(h)}
                      >
                        <Download className="h-3 w-3" /> 下载
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[11px] text-muted-foreground hover:text-destructive"
                    onClick={() => store.removeHistory(h.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
