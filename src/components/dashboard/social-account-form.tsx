"use client";

import { useMemo, useState } from "react";
import {
  SocialPlatform,
  SOCIAL_PLATFORM_LABELS,
  DEFAULT_SOCIAL_TEMPLATE,
} from "@/lib/api";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const PLATFORMS = Object.keys(SOCIAL_PLATFORM_LABELS) as SocialPlatform[];

function renderTemplatePreview(template: string) {
  return template
    .replaceAll("{price}", "۱٬۲۵۰٬۰۰۰")
    .replaceAll("{title}", "کفش اسپرت مردانه")
    .replaceAll("{description}", "سایزبندی ۴۰ تا ۴۵، ارسال رایگان");
}

type SocialAccountFormProps = {
  title: string;
  description?: string;
  initialPlatform?: SocialPlatform | string;
  initialChatId?: string;
  initialTemplate?: string;
  requireToken?: boolean;
  tokenPlaceholder?: string;
  saving: boolean;
  submitLabel: string;
  cancelLabel?: string;
  onSubmit: (values: {
    platform: SocialPlatform;
    botToken: string;
    chatId: string;
    template: string;
  }) => Promise<void> | void;
  onCancel?: () => void;
};

export function SocialAccountForm({
  title,
  description,
  initialPlatform = "eitaa",
  initialChatId = "",
  initialTemplate = DEFAULT_SOCIAL_TEMPLATE,
  requireToken = true,
  tokenPlaceholder = "توکن ربات پلتفرم",
  saving,
  submitLabel,
  cancelLabel = "انصراف",
  onSubmit,
  onCancel,
}: SocialAccountFormProps) {
  const [platform, setPlatform] = useState<SocialPlatform>(
    (initialPlatform as SocialPlatform) || "eitaa"
  );
  const [botToken, setBotToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [chatId, setChatId] = useState(initialChatId);
  const [template, setTemplate] = useState(
    initialTemplate || DEFAULT_SOCIAL_TEMPLATE
  );
  const [localError, setLocalError] = useState("");

  const preview = useMemo(() => renderTemplatePreview(template), [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requireToken && !botToken.trim()) {
      setLocalError("توکن ربات الزامی است");
      return;
    }
    if (!chatId.trim()) {
      setLocalError("آیدی کانال الزامی است");
      return;
    }
    setLocalError("");
    await onSubmit({
      platform,
      botToken: botToken.trim(),
      chatId: chatId.trim(),
      template: template.trim(),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-slate-200 p-6 space-y-4"
    >
      <h2 className="font-bold text-slate-800">{title}</h2>
      {description && <p className="text-sm text-slate-500">{description}</p>}
      {localError && <p className="text-sm text-red-600">{localError}</p>}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          پلتفرم
        </label>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 bg-white"
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {SOCIAL_PLATFORM_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          توکن ربات (botToken)
        </label>
        <div className="relative">
          <input
            type={showToken ? "text" : "password"}
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder={tokenPlaceholder}
            className="w-full px-4 py-3 pl-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
            dir="ltr"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowToken((v) => !v)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          آیدی کانال / چت (chatId)
        </label>
        <input
          type="text"
          value={chatId}
          onChange={(e) => setChatId(e.target.value)}
          placeholder="@mychannel"
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
          dir="ltr"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          قالب کپشن
        </label>
        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          rows={5}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 font-mono text-sm"
          dir="rtl"
        />
        <p className="text-xs text-slate-400 mt-1">
          Placeholderها: {"{title}"} {"{description}"} {"{price}"}
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">پیش‌نمایش زنده</p>
        <pre className="text-sm bg-slate-50 border border-slate-100 rounded-xl p-4 whitespace-pre-wrap text-slate-700">
          {preview}
        </pre>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 min-w-[140px] py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-xl inline-flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              در حال ذخیره...
            </>
          ) : (
            submitLabel
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600"
          >
            {cancelLabel}
          </button>
        )}
      </div>
    </form>
  );
}
