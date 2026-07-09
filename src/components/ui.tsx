"use client";

import { ChevronDown, Loader2 } from "lucide-react";

type SelectOption = string | { label: string; value: string };
type SelectGroup = { label: string; options: SelectOption[] };

function optionValue(option: SelectOption) {
  return typeof option === "string" ? option : option.value;
}

function optionLabel(option: SelectOption) {
  return typeof option === "string" ? option : option.label;
}

export function Select({
  value,
  onChange,
  options,
  groups,
  placeholder,
  className = "",
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options?: SelectOption[];
  groups?: SelectGroup[];
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">{ariaLabel || placeholder || "Select option"}</span>
      <select
        aria-label={ariaLabel || placeholder || "Select option"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full appearance-none rounded-lg border border-zinc-200 bg-white px-3 pr-10 text-sm font-semibold text-zinc-800 shadow-sm outline-none ring-0 transition hover:border-[#C8A23A] focus:border-[#006B3C] focus:shadow-[0_0_0_3px_rgba(200,162,58,0.24)]"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {groups
          ? groups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option key={optionValue(option)} value={optionValue(option)}>
                    {optionLabel(option)}
                  </option>
                ))}
              </optgroup>
            ))
          : options?.map((option) => (
              <option key={optionValue(option)} value={optionValue(option)}>
                {optionLabel(option)}
              </option>
            ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" size={17} />
    </label>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:shadow-md ${className}`}>
      {children}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center">
      <p className="font-bold text-zinc-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{body}</p>
    </div>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-4 text-sm font-semibold text-zinc-600">
      <Loader2 className="animate-spin text-[#006B3C]" size={17} />
      {label}
    </div>
  );
}
