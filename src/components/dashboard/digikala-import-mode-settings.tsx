"use client";

import type {
  DigikalaImportMode,
  DigikalaReplaceField,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const ATOMIC_REPLACE_FIELDS: { id: DigikalaReplaceField; label: string }[] = [
  { id: "price", label: "قیمت" },
  { id: "stock", label: "موجودی" },
  { id: "content", label: "محتوا" },
  { id: "media", label: "رسانه" },
];

const REPLACE_PRESETS: { value: DigikalaReplaceField; label: string }[] = [
  { value: "all", label: "همه فیلدها" },
  { value: "price", label: "فقط قیمت" },
  { value: "stock", label: "فقط موجودی" },
  { value: "price_stock", label: "قیمت و موجودی" },
  { value: "content", label: "محتوا (عنوان، توضیحات، واریانت، …)" },
  { value: "media", label: "رسانه (عکس و ویدیو)" },
];

export type DigikalaImportModeSettingsValue = {
  importMode: DigikalaImportMode;
  nameSuffix: string;
  skuSuffix: string;
  replacePreset: DigikalaReplaceField | "custom";
  customReplaceFields: DigikalaReplaceField[];
};

type Props = {
  value: DigikalaImportModeSettingsValue;
  onChange: (next: DigikalaImportModeSettingsValue) => void;
  disabled?: boolean;
  className?: string;
};

export function resolveReplaceFields(
  value: DigikalaImportModeSettingsValue
): DigikalaReplaceField | DigikalaReplaceField[] {
  if (value.replacePreset !== "custom") return value.replacePreset;
  if (value.customReplaceFields.length === 0) return "all";
  if (value.customReplaceFields.length === 1) {
    return value.customReplaceFields[0] ?? "all";
  }
  return value.customReplaceFields;
}

export function DigikalaImportModeSettings({
  value,
  onChange,
  disabled,
  className,
}: Props) {
  const patch = (partial: Partial<DigikalaImportModeSettingsValue>) =>
    onChange({ ...value, ...partial });

  const modes: {
    id: DigikalaImportMode;
    title: string;
    hint: string;
    default?: boolean;
  }[] = [
    {
      id: "skip",
      title: "رد شوند (skip)",
      hint: "کالاهایی که قبلاً لینک شده‌اند ایمپورت نمی‌شوند.",
      default: true,
    },
    {
      id: "duplicate",
      title: "دوباره اضافه شوند (duplicate)",
      hint: "همه کالاها به‌صورت محصول جدید در باسلام ساخته می‌شوند.",
    },
    {
      id: "replace",
      title: "جایگزین شوند (replace)",
      hint: "محصول لینک‌شده با داده تازه دیجی‌کالا به‌روز می‌شود؛ بدون لینک، محصول جدید ساخته می‌شود.",
    },
  ];

  return (
    <fieldset
      disabled={disabled}
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-4 space-y-3",
        className
      )}
    >
      <legend className="text-sm font-bold text-slate-800 px-1">
        کالاهای قبلاً ایمپورت‌شده
      </legend>

      <div className="space-y-2">
        {modes.map((mode) => {
          const selected = value.importMode === mode.id;
          return (
            <div
              key={mode.id}
              className={cn(
                "rounded-xl border p-3 transition-colors",
                selected
                  ? "border-orange-300 bg-orange-50"
                  : "border-slate-200 hover:border-slate-300",
                disabled && "opacity-70"
              )}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="digikala-import-mode"
                  value={mode.id}
                  checked={selected}
                  disabled={disabled}
                  onChange={() => patch({ importMode: mode.id })}
                  className="mt-1 w-4 h-4 accent-orange-500"
                />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">
                      {mode.title}
                    </span>
                    {mode.default && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700">
                        پیش‌فرض
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-slate-500 mt-1 leading-relaxed">
                    {mode.hint}
                  </span>
                </span>
              </label>

              {selected && mode.id === "duplicate" && (
                <div className="mt-3 mr-7 grid gap-3 sm:grid-cols-2">
                  <div>
                    <span className="block text-xs text-slate-600 mb-1">
                      پسوند نام
                    </span>
                    <input
                      type="text"
                      value={value.nameSuffix}
                      disabled={disabled}
                      onChange={(e) => patch({ nameSuffix: e.target.value })}
                      placeholder=" (کپی)"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 disabled:bg-slate-50"
                    />
                  </div>
                  <div>
                    <span className="block text-xs text-slate-600 mb-1">
                      پسوند SKU (اختیاری)
                    </span>
                    <input
                      type="text"
                      value={value.skuSuffix}
                      disabled={disabled}
                      dir="ltr"
                      onChange={(e) => patch({ skuSuffix: e.target.value })}
                      placeholder="v2"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 disabled:bg-slate-50"
                    />
                    <span className="block text-[11px] text-slate-400 mt-1">
                      خالی بماند تا پسوند خودکار ساخته شود
                    </span>
                  </div>
                </div>
              )}

              {selected && mode.id === "replace" && (
                <div className="mt-3 mr-7 space-y-3">
                  <div>
                    <span className="block text-xs text-slate-600 mb-1">
                      فیلدهای جایگزینی
                    </span>
                    <select
                      value={value.replacePreset}
                      disabled={disabled}
                      onChange={(e) =>
                        patch({
                          replacePreset: e.target.value as
                            | DigikalaReplaceField
                            | "custom",
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 disabled:bg-slate-50"
                    >
                      {REPLACE_PRESETS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                      <option value="custom">ترکیب چند مورد</option>
                    </select>
                  </div>
                  {value.replacePreset === "custom" && (
                    <div className="flex flex-wrap gap-2">
                      {ATOMIC_REPLACE_FIELDS.map((field) => {
                        const checked = value.customReplaceFields.includes(
                          field.id
                        );
                        return (
                          <label
                            key={field.id}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer",
                              checked
                                ? "border-orange-300 bg-white text-orange-800"
                                : "border-slate-200 text-slate-600"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={() => {
                                const next = checked
                                  ? value.customReplaceFields.filter(
                                      (id) => id !== field.id
                                    )
                                  : [...value.customReplaceFields, field.id];
                                patch({ customReplaceFields: next });
                              }}
                              className="w-3.5 h-3.5 accent-orange-500"
                            />
                            {field.label}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
