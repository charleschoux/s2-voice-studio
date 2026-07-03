"use client";

import * as React from "react";
import { Bold, Brackets, Languages, Mic2, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  EMOTION_TAGS,
  NATURAL_CUE_EXAMPLES,
  CN_PHONEME_TEMPLATE,
  EN_PHONEME_TEMPLATE,
  SPEAKER_TAG_PREFIX,
} from "@/lib/constants";
import { utf8ByteLength, formatBytes } from "@/lib/utils";

interface TextEditorProps {
  value: string;
  onChange: (v: string) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}

export function TextEditor({ value, onChange, textareaRef }: TextEditorProps) {
  const insert = (snippet: string) => {
    const ta = textareaRef?.current;
    if (!ta) {
      onChange(value + snippet);
      return;
    }
    const start = ta.selectionStart ?? value.length;
    const end = ta.selectionEnd ?? value.length;
    const next = value.slice(0, start) + snippet + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + snippet.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Brackets className="h-3.5 w-3.5" /> 情绪/语气
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>S2 方括号标签</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {EMOTION_TAGS.map((t) => (
              <DropdownMenuItem
                key={t.insert}
                onClick={() => insert(t.insert + " ")}
              >
                <span className="flex-1">{t.label}</span>
                <code className="text-xs text-muted-foreground">{t.insert}</code>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>自然语言 cue</DropdownMenuLabel>
            {NATURAL_CUE_EXAMPLES.map((c) => (
              <DropdownMenuItem key={c} onClick={() => insert(c + " ")}>
                <code className="text-xs">{c}</code>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Mic2 className="h-3.5 w-3.5" /> 音素模板
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>中文音素 (pinyin)</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => insert(CN_PHONEME_TEMPLATE)}>
              <span className="flex-1 text-xs">一字/一音节一个 tag</span>
              <code className="text-[10px]">gong1</code>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>英文音素 (CMU Arpabet)</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => insert(EN_PHONEME_TEMPLATE)}>
              <code className="text-[10px]">EH1 N JH AH0 N IH1 R</code>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Users className="h-3.5 w-3.5" /> 多说话人
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>说话人标签</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => insert(`${SPEAKER_TAG_PREFIX}0|>`)}>
              <code className="text-xs">{`<|speaker:0|>`}</code>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insert(`${SPEAKER_TAG_PREFIX}1|>`)}>
              <code className="text-xs">{`<|speaker:1|>`}</code>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <p className="px-2 py-1 text-[11px] text-muted-foreground">
              多说话人主要面向 s2-pro，对 s2.1-pro-free 需实测兼容性，且需要
              reference_id 数组。
            </p>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => insert("[break] ")}
          title="短停顿"
        >
          <Plus className="h-3.5 w-3.5" /> break
        </Button>
      </div>

      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="输入要合成的文本… 可插入情绪标签 [happy]、音素 <phoneme> 或多说话人 <speaker:0>。"
        className="min-h-[180px] font-mono text-sm leading-relaxed"
      />

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary" className="gap-1">
          <Bold className="h-3 w-3" /> {value.length} chars
        </Badge>
        <Badge variant="secondary" className="gap-1">
          <Languages className="h-3 w-3" /> {formatBytes(utf8ByteLength(value), 1)} UTF-8
        </Badge>
        <span className="ml-auto">
          计费按 M UTF-8 bytes；s2.1-pro-free 显示 $0/M bytes（fair-use）。
        </span>
      </div>
    </div>
  );
}
