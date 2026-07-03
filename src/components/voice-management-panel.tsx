"use client";

import * as React from "react";
import {
  Search,
  Star,
  Copy,
  Check,
  Play,
  Pause,
  Pencil,
  Trash2,
  Plus,
  Upload,
  Mic,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
import { Panel, PanelHeader, SectionLabel } from "./studio-primitives";
import { cn, copyToClipboard } from "@/lib/utils";
import { SORT_OPTIONS, MODEL_VISIBILITY } from "@/lib/constants";
import {
  fetchModels,
  fetchModel,
  patchModel,
  deleteModel,
  createModel,
  instantCloneTts,
  asr,
  type InstantCloneRef,
} from "@/lib/api-client";
import type { VoiceModel } from "@/lib/types";
import { useAppStore } from "@/lib/use-app-store";
import { useHealth } from "@/lib/use-health";
import { blobToBase64Client, mimeForFormat, extForFormat } from "@/lib/client-media";

const SUB_NAV = [
  { k: "library", label: "模型库", en: "Library" },
  { k: "clone", label: "持久克隆", en: "Clone" },
  { k: "instant", label: "即时克隆", en: "Instant" },
  { k: "manage", label: "我的模型", en: "Manage" },
] as const;

type SubKey = (typeof SUB_NAV)[number]["k"];

export function VoiceManagementPanel() {
  const health = useHealth();
  const mock = health.mock || !health.hasApiKey;
  const [sub, setSub] = React.useState<SubKey>("library");

  return (
    <div className="space-y-4">
      <Panel className="overflow-hidden">
        <PanelHeader
          title="Voice Library & Cloning"
          zh="声音管理"
          icon={<Mic className="h-3.5 w-3.5" />}
        />
        <div className="flex flex-wrap gap-1.5 p-2.5">
          {SUB_NAV.map((n) => (
            <Button
              key={n.k}
              size="sm"
              variant={sub === n.k ? "default" : "outline"}
              onClick={() => setSub(n.k)}
              className="gap-2"
            >
              {sub === n.k && <span className="h-1.5 w-1.5 rounded-full bg-success" />}
              <span>{n.label}</span>
              <span className="text-[10px] font-normal text-muted-foreground">{n.en}</span>
            </Button>
          ))}
        </div>
      </Panel>

      {mock && (
        <div className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
          未配置 FISH_API_KEY 或已开启 Mock。声音管理接口将无法真实调用，可浏览界面但需配置 Key 后才能克隆/管理。
        </div>
      )}

      {sub === "library" && <LibrarySubPanel />}
      {sub === "clone" && <PersistentCloneForm />}
      {sub === "instant" && <InstantCloneForm />}
      {sub === "manage" && <ManageSubPanel />}
    </div>
  );
}

// ---------------- Library ----------------

function LibrarySubPanel() {
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState<string>("score");
  const [lang, setLang] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<VoiceModel[]>([]);
  const [err, setErr] = React.useState<string | null>(null);
  const store = useAppStore();

  const run = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetchModels({
        title: q || undefined,
        sort_by: sort as "score" | "task_count" | "created_at",
        language: lang || undefined,
        page_size: 40,
      });
      setItems(res.items);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [q, sort, lang]);

  React.useEffect(() => {
    const t = setTimeout(run, 300);
    return () => clearTimeout(t);
  }, [run]);

  return (
    <Panel className="overflow-hidden p-3.5 sm:p-4">
      <div className="mb-3 space-y-2.5">
        <SectionLabel hint={`${items.length} results`}>Search · 检索</SectionLabel>
        <div className="flex flex-wrap items-end gap-2">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="按 title 搜索"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="w-36">
            <Select value={lang || "all"} onValueChange={(v) => setLang(v === "all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="语言" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="ko">한국어</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-36">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger><SelectValue placeholder="排序" /></SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="icon" onClick={run} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>
      {err && (
        <p className="mb-3 rounded-md border border-destructive/40 bg-destructive/8 px-2 py-1.5 text-xs text-destructive">
          {err}
        </p>
      )}
      <ScrollArea className="h-[60vh] rounded-md border border-border bg-card/30 scrollbar-thin">
        <div className="grid grid-cols-1 gap-2 p-2 md:grid-cols-2">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
            : items.length === 0
              ? <p className="col-span-full px-2 py-12 text-center text-sm text-muted-foreground">没有匹配的模型</p>
              : items.map((m) => (
                  <ModelCard
                    key={m._id}
                    model={m}
                    isFav={store.isFavorite(m._id)}
                    onFav={() =>
                      store.isFavorite(m._id)
                        ? store.removeFavorite(m._id)
                        : store.addFavorite({ id: m._id, title: m.title })
                    }
                  />
                ))}
        </div>
      </ScrollArea>
    </Panel>
  );
}

function ModelCard({
  model,
  isFav,
  onFav,
}: {
  model: VoiceModel;
  isFav: boolean;
  onFav: () => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const [previewing, setPreviewing] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const sampleUrl = React.useMemo(() => {
    const s = model.samples?.[0];
    if (!s) return null;
    if (typeof s.audio === "string" && /^https?:/.test(s.audio)) return s.audio;
    return null;
  }, [model]);

  const togglePreview = () => {
    if (!sampleUrl) {
      toast.info("该模型未提供可试听的 sample 链接");
      return;
    }
    if (!audioRef.current) {
      audioRef.current = new Audio(sampleUrl);
      audioRef.current.onended = () => setPreviewing(false);
    }
    if (previewing) {
      audioRef.current.pause();
      setPreviewing(false);
    } else {
      audioRef.current.play().catch(() => toast.error("试听失败"));
      setPreviewing(true);
    }
  };

  return (
    <div className="flex flex-col gap-2.5 rounded-md border border-border bg-card/50 p-3 transition-colors hover:border-primary/30">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border bg-card/60 text-primary">
          <Mic className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate font-medium">{model.title}</span>
            {model.visibility && (
              <Badge variant="mono" className="text-[9px]">{model.visibility}</Badge>
            )}
            {model.state && (
              <Badge variant="secondary" className="text-[9px]">{model.state}</Badge>
            )}
          </div>
          <code className="mt-0.5 block truncate readout text-[11px] text-muted-foreground">{model._id}</code>
        </div>
        <Button size="icon-sm" variant="ghost" onClick={onFav} aria-label="收藏">
          <Star className={cn("h-3.5 w-3.5", isFav && "fill-warning text-warning")} />
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
        {model.languages?.map((l) => (
          <Badge key={l} variant="mono" className="text-[9px]">{l}</Badge>
        ))}
        {typeof model.task_count === "number" && <span className="readout">· {model.task_count} tasks</span>}
        {typeof model.like_count === "number" && <span className="readout">· ♥ {model.like_count}</span>}
        {typeof model.score === "number" && <span className="readout">· score {model.score.toFixed(2)}</span>}
      </div>
      {model.tags && model.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {model.tags.slice(0, 4).map((t) => (
            <Badge key={t} variant="outline" className="text-[9px]">#{t}</Badge>
          ))}
        </div>
      )}
      <Separator />
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" variant="outline" onClick={togglePreview}>
          {previewing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          试听
          {previewing && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-success" />}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            copyToClipboard(model._id).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 800);
              toast.success("已复制 id");
            });
          }}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          复制 id
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            copyToClipboard(model._id).then(() => toast.success("已设为当前 voice（粘贴到工作台 reference_id）"));
          }}
        >
          设为 voice
        </Button>
      </div>
    </div>
  );
}

// ---------------- Persistent clone ----------------

function PersistentCloneForm() {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [visibility, setVisibility] = React.useState<"private" | "unlist" | "public">("private");
  const [tags, setTags] = React.useState("");
  const [texts, setTexts] = React.useState("");
  const [enhance, setEnhance] = React.useState(true);
  const [generateSample, setGenerateSample] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const [busy, setBusy] = React.useState(false);

  const submit = async () => {
    if (!title.trim()) return toast.error("请输入 title");
    if (files.length === 0) return toast.error("请至少上传一个参考音频");
    setBusy(true);
    try {
      const voices = await Promise.all(
        files.map(async (f) => ({
          filename: f.name,
          mime: f.type || "audio/wav",
          base64: await blobToBase64Client(f),
        })),
      );
      await createModel({
        title: title.trim(),
        description: description.trim() || undefined,
        visibility,
        train_mode: "fast",
        texts: texts ? texts.split("\n").map((s) => s.trim()).filter(Boolean) : undefined,
        tags: tags ? tags.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
        enhance_audio_quality: enhance,
        generate_sample: generateSample,
        voices,
      });
      toast.success("已提交持久克隆请求，等待训练完成");
      setTitle("");
      setDescription("");
      setFiles([]);
      setTexts("");
      setTags("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel className="space-y-3 p-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">持久声音克隆</h3>
          <code className="readout text-[10px] text-muted-foreground">POST /model</code>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          multipart/form-data 由服务端组装；上传多段清晰参考音频（建议 10–30 秒/段），填写 title 即可。训练模式 fast。
        </p>
        <div className="grid gap-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">title *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">visibility</Label>
          <Select value={visibility} onValueChange={(v) => setVisibility(v as typeof visibility)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MODEL_VISIBILITY.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">tags (逗号分隔)</Label>
          <Input value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">texts (每行一段，可选)</Label>
          <Textarea value={texts} onChange={(e) => setTexts(e.target.value)} className="min-h-[80px]" />
        </div>
        <ToggleRow label="enhance_audio_quality" checked={enhance} onChange={setEnhance} />
        <ToggleRow label="generate_sample" checked={generateSample} onChange={setGenerateSample} />
      </Panel>

      <Panel className="space-y-3 p-4">
        <h3 className="text-sm font-semibold tracking-tight">参考音频</h3>
        <FileDrop
          multiple
          onChange={setFiles}
          count={files.length}
          list={files.map((f) => ({ name: f.name, size: f.size }))}
        />
        <Button onClick={submit} disabled={busy} className="w-full" size="lg">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          提交克隆
        </Button>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          注意：克隆为独立计费/训练流程，请遵守 Fish Audio 使用条款，仅克隆你有权使用的声音。
        </p>
      </Panel>
    </div>
  );
}

// ---------------- Instant clone ----------------

function InstantCloneForm() {
  const [text, setText] = React.useState("");
  const [refFile, setRefFile] = React.useState<File | null>(null);
  const [transcript, setTranscript] = React.useState("");
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [blob, setBlob] = React.useState<Blob | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [asrBusy, setAsrBusy] = React.useState(false);

  const runAsr = async () => {
    if (!refFile) return toast.error("请先上传参考音频");
    setAsrBusy(true);
    try {
      const base64 = await blobToBase64Client(refFile);
      const res = await asr({
        audio: { filename: refFile.name, mime: refFile.type || "audio/wav", base64 },
      });
      const t = (res as { transcript?: string; text?: string }).transcript || (res as { text?: string }).text || "";
      if (t) {
        setTranscript(t);
        toast.success("ASR 识别完成，已填入 transcript");
      } else {
        toast.warning("ASR 未返回文本");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAsrBusy(false);
    }
  };

  const submit = async () => {
    if (!text.trim()) return toast.error("请输入要合成的文本");
    if (!refFile) return toast.error("请上传 10–30 秒清晰参考音频");
    setBusy(true);
    setErr(null);
    try {
      const base64 = await blobToBase64Client(refFile);
      const refs: InstantCloneRef[] = [
        {
          filename: refFile.name,
          mime: refFile.type || "audio/wav",
          base64,
          text: transcript.trim() || undefined,
        },
      ];
      const out = await instantCloneTts(text, refs, { format: "mp3" });
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setBlob(out);
      setAudioUrl(URL.createObjectURL(out));
      toast.success("即时克隆合成完成");
    } catch (e) {
      setErr((e as Error).message);
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel className="space-y-3 p-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">即时克隆</h3>
          <code className="readout text-[10px] text-muted-foreground">references via MessagePack</code>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          上传 10–30 秒清晰参考音频 + 精确 transcript，通过 <code className="readout text-foreground/80">references</code> 直接 TTS。JSON 不能传 raw binary，请求由服务端用 MessagePack 转发。
        </p>
        <FileDrop
          onChange={(files) => setRefFile(files[0] || null)}
          count={refFile ? 1 : 0}
          list={refFile ? [{ name: refFile.name, size: refFile.size }] : []}
          icon={<Mic className="h-6 w-6" />}
        />
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">transcript (精确)</Label>
            <Button size="sm" variant="outline" onClick={runAsr} disabled={asrBusy || !refFile}>
              {asrBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mic className="h-3.5 w-3.5" />}
              用 ASR 识别
            </Button>
          </div>
          <Textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="参考音频对应的精确文字" />
        </div>
        <div className="grid gap-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">要合成的文本 *</Label>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <Button onClick={submit} disabled={busy} size="lg">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          即时克隆合成
        </Button>
        {err && <p className="text-xs text-destructive">{err}</p>}
      </Panel>

      <Panel className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold tracking-tight">结果</h3>
          {audioUrl && <span className="h-1.5 w-1.5 rounded-full bg-success" />}
        </div>
        {audioUrl ? (
          <audio src={audioUrl} controls className="w-full rounded-md" />
        ) : (
          <div className="clay-inset flex h-40 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <Mic className="h-5 w-5 opacity-50" />
            <span>合成后音频显示在这里</span>
          </div>
        )}
        {blob && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const a = document.createElement("a");
              a.href = audioUrl!;
              a.download = `instant-clone.${extForFormat("mp3")}`;
              a.click();
            }}
          >
            <Upload className="h-3.5 w-3.5" /> 下载
          </Button>
        )}
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          ASR 为独立计费接口；即时克隆使用 TTS 计费（按 UTF-8 bytes）。
        </p>
      </Panel>
    </div>
  );
}

// ---------------- Manage my models ----------------

function ManageSubPanel() {
  const [items, setItems] = React.useState<VoiceModel[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetchModels({ self: true, page_size: 50, sort_by: "created_at" });
      setItems(res.items);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <Panel className="space-y-3 p-3.5 sm:p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold tracking-tight">我的模型</h3>
          <code className="readout text-[10px] text-muted-foreground">self=true</code>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> 刷新
        </Button>
      </div>
      {err && (
        <p className="rounded-md border border-destructive/40 bg-destructive/8 px-2 py-1.5 text-xs text-destructive">
          {err}
        </p>
      )}
      <ScrollArea className="h-[60vh] rounded-md border border-border bg-card/30 scrollbar-thin">
        <div className="space-y-2 p-2">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
            : items.length === 0
              ? <p className="px-2 py-12 text-center text-sm text-muted-foreground">没有你的模型</p>
              : items.map((m) => <ManageRow key={m._id} model={m} onChanged={load} />)}
        </div>
      </ScrollArea>
    </Panel>
  );
}

function ManageRow({ model, onChanged }: { model: VoiceModel; onChanged: () => void }) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [title, setTitle] = React.useState(model.title);
  const [description, setDescription] = React.useState(model.description || "");
  const [visibility, setVisibility] = React.useState(model.visibility || "private");
  const [tags, setTags] = React.useState((model.tags || []).join(", "));
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await patchModel(model._id, {
        title: title.trim(),
        description: description.trim() || undefined,
        visibility: visibility as "private" | "unlist" | "public",
        tags: tags ? tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
      });
      toast.success("已更新");
      setEditOpen(false);
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await deleteModel(model._id);
      toast.success("已删除");
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-md border border-border bg-card/50 p-3">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border bg-card/60 text-primary">
          <Mic className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-medium">{model.title}</span>
            {model.visibility && <Badge variant="mono" className="text-[9px]">{model.visibility}</Badge>}
            {model.state && <Badge variant="secondary" className="text-[9px]">{model.state}</Badge>}
          </div>
          <code className="mt-0.5 block truncate readout text-[11px] text-muted-foreground">{model._id}</code>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Pencil className="h-3.5 w-3.5" /> 编辑
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑模型</DialogTitle>
              <DialogDescription>更新 title / description / visibility / tags。</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid gap-2">
                <Label>title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>visibility</Label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODEL_VISIBILITY.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>tags (逗号分隔)</Label>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "保存"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="destructive" disabled={deleting}>
              <Trash2 className="h-3.5 w-3.5" /> 删除
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除模型？</AlertDialogTitle>
              <AlertDialogDescription>
                将调用 DELETE /model/{model._id}，删除后不可恢复。请二次确认。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={remove}>
                确认删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ---------------- shared bits ----------------

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (c: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card/40 px-3 py-2">
      <Label className="text-xs font-medium">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function FileDrop({
  multiple,
  onChange,
  count,
  list,
  icon,
}: {
  multiple?: boolean;
  onChange: (files: File[]) => void;
  count: number;
  list: { name: string; size: number }[];
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground hover:bg-accent">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
          {icon ?? <Upload className="h-5 w-5" />}
        </span>
        <span>点击选择参考音频{multiple ? " · 可多选" : ""}</span>
        <input
          type="file"
          multiple={multiple}
          accept="audio/*"
          className="hidden"
          onChange={(e) => onChange(Array.from(e.target.files || []))}
        />
      </label>
      {count > 0 && (
        <ul className="space-y-1 text-xs">
          {list.map((f, i) => (
            <li key={i} className="flex items-center justify-between gap-2 rounded border border-border bg-card/40 px-2 py-1">
              <span className="truncate">{f.name}</span>
              <span className="readout shrink-0 text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
