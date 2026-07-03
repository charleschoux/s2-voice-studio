"use client";

import * as React from "react";
import { Bookmark, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAppStore } from "@/lib/use-app-store";
import type { TtsForm } from "@/lib/schemas";

interface Props {
  form: TtsForm;
  onApply: (params: Partial<TtsForm>) => void;
}

export function PresetPicker({ form, onApply }: Props) {
  const store = useAppStore();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [desc, setDesc] = React.useState("");

  const save = async () => {
    if (!name.trim()) {
      toast.error("请输入预设名");
      return;
    }
    const { model: _m, _msgpack: _f, text: _t, reference_id: _r, ...params } = form;
    void _m;
    void _f;
    void _t;
    void _r;
    await store.addPreset({ name: name.trim(), description: desc.trim(), params });
    toast.success("预设已保存");
    setName("");
    setDesc("");
    setOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        onValueChange={(id) => {
          const p = store.presets.find((x) => x.id === id);
          if (p) {
            onApply(p.params as Partial<TtsForm>);
            toast.success(`已应用预设：${p.name}`);
          }
        }}
        value=""
      >
        <SelectTrigger className="h-8 w-[200px] text-xs">
          <Bookmark className="mr-1 h-3.5 w-3.5 text-primary" />
          <SelectValue placeholder="应用预设" />
        </SelectTrigger>
        <SelectContent>
          {store.presets.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
              {p.builtin && <span className="ml-1 text-[10px] text-muted-foreground">(内置)</span>}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Save className="h-3.5 w-3.5" /> 存为预设
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>保存当前参数为预设</DialogTitle>
            <DialogDescription>
              预设保存在浏览器 IndexedDB，不会上传。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="预设名称" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="描述（可选）" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
            <Button onClick={save}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {store.presets.some((p) => !p.builtin) && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8">
              <Trash2 className="h-3.5 w-3.5" /> 管理
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>管理预设</DialogTitle>
              <DialogDescription>内置预设不可删除。</DialogDescription>
            </DialogHeader>
            <div className="max-h-72 space-y-1 overflow-auto scrollbar-thin">
              {store.presets.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
                >
                  <div className="flex-1">
                    <div className="font-medium">{p.name}</div>
                    {p.description && (
                      <div className="text-xs text-muted-foreground">{p.description}</div>
                    )}
                  </div>
                  {!p.builtin && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => store.removePreset(p.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
