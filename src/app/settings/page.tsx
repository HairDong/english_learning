"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useVocabularyStore } from "@/store/vocabulary-store";
import { useSettingsStore } from "@/store/settings-store";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  Eye, EyeOff, KeyRound, Globe, Bot, GraduationCap, Save, CheckCircle2,
} from "lucide-react";

const levels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export default function SettingsPage() {
  const hydrated = useHydrated();
  const level = useVocabularyStore((state) => state.level);
  const setLevel = useVocabularyStore((state) => state.setLevel);

  const {
    openaiApiKey, openaiModel, googleApiKey, googleModel, customRoute,
    setOpenaiApiKey, setOpenaiModel, setGoogleApiKey, setGoogleModel, setCustomRoute,
  } = useSettingsStore();

  const [showOpenai, setShowOpenai] = useState(false);
  const [showGoogle, setShowGoogle] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Cấu hình cấp độ học và API keys cho các tính năng AI.
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Đã lưu cài đặt!
          </div>
        )}

        {/* CEFR Level */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <GraduationCap className="h-5 w-5 text-sky-500" />
              Learning Level
            </div>
            <p className="text-sm text-muted-foreground">
              Chọn trình độ CEFR để AI tạo từ vựng phù hợp.
            </p>
          </CardHeader>
          <CardContent>
            <Label className="mb-1.5 block text-sm font-medium">CEFR Level</Label>
            <Select
              value={hydrated ? level : "A1"}
              onValueChange={(value) => setLevel(value as typeof level)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* OpenAI API Key */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <KeyRound className="h-5 w-5 text-violet-500" />
              OpenAI API Key
            </div>
            <p className="text-sm text-muted-foreground">
              Key này dùng khi không có custom route. Lưu trong localStorage trình duyệt của bạn.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Input
                id="openai-key"
                type={showOpenai ? "text" : "password"}
                placeholder="sk-..."
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOpenai((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showOpenai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="space-y-1.5 pt-1">
              <Label htmlFor="openai-model" className="text-sm font-medium">Model</Label>
              <Input
                id="openai-model"
                placeholder="gpt-4o-mini"
                value={openaiModel}
                onChange={(e) => setOpenaiModel(e.target.value)}
              />
            </div>
            {openaiApiKey && (
              <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                ✓ Key đã nhập
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Google API Key */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Globe className="h-5 w-5 text-blue-500" />
              Google API Key
            </div>
            <p className="text-sm text-muted-foreground">
              Dành cho các tính năng Google (Text-to-Speech nâng cao, Translate API,…).
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Input
                id="google-key"
                type={showGoogle ? "text" : "password"}
                placeholder="AIzaSy..."
                value={googleApiKey}
                onChange={(e) => setGoogleApiKey(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowGoogle((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showGoogle ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="space-y-1.5 pt-1">
              <Label htmlFor="google-model" className="text-sm font-medium">Model</Label>
              <Input
                id="google-model"
                placeholder="gemini-2.5-flash"
                value={googleModel}
                onChange={(e) => setGoogleModel(e.target.value)}
              />
            </div>
            {googleApiKey && (
              <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                ✓ Key đã nhập
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Custom AI Route */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Bot className="h-5 w-5 text-orange-500" />
              Custom AI Route
            </div>
            <p className="text-sm text-muted-foreground">
              Dùng bất kỳ provider tương thích OpenAI (OpenRouter, LM Studio, Groq, Mistral,…).
              Nếu có cấu hình này, nó sẽ ưu tiên hơn OpenAI key.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="custom-url" className="text-sm font-medium">Base URL</Label>
              <Input
                id="custom-url"
                placeholder="https://openrouter.ai/api/v1"
                value={customRoute.url}
                onChange={(e) => setCustomRoute({ url: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="custom-key" className="text-sm font-medium">API Key</Label>
              <div className="relative">
                <Input
                  id="custom-key"
                  type={showCustom ? "text" : "password"}
                  placeholder="sk-or-..."
                  value={customRoute.apiKey}
                  onChange={(e) => setCustomRoute({ apiKey: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCustom((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCustom ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="custom-model" className="text-sm font-medium">Model</Label>
              <Input
                id="custom-model"
                placeholder="gpt-4o-mini, mistral-7b-instruct, …"
                value={customRoute.model}
                onChange={(e) => setCustomRoute({ model: e.target.value })}
              />
            </div>
            {customRoute.url && customRoute.apiKey && (
              <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                ✓ Custom route đang được dùng
              </Badge>
            )}
          </CardContent>
        </Card>

        <Separator />

        <Button
          type="button"
          className="rounded-full bg-sky-600 text-white hover:bg-sky-700 gap-2"
          onClick={handleSave}
        >
          <Save className="h-4 w-4" />
          Lưu cài đặt
        </Button>

        <p className="text-xs text-muted-foreground">
          API keys được lưu trong localStorage trình duyệt của bạn và KHÔNG gửi lên server của chúng tôi — chỉ gửi trực tiếp tới provider AI khi bạn dùng tính năng AI.
        </p>
      </div>
    </AppShell>
  );
}
