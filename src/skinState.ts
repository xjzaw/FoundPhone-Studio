import { useState, type Dispatch, type SetStateAction } from "react";
import type { SkinProps } from "./AppSkins";
import type { UiValue } from "./schema";
import type { Item } from "./schema";
function matches(value: unknown, initial: UiValue): value is UiValue {
  return Array.isArray(initial)
    ? Array.isArray(value) && value.every((v) => typeof v === "string")
    : typeof value === typeof initial &&
        (typeof value !== "number" || Number.isFinite(value));
}
type StateValue<T> = T extends string ? string : T extends number ? number : T extends boolean ? boolean : T;
export function useSkinState<T extends UiValue>(
  p: Pick<SkinProps, "ui" | "onUi">,
  key: string,
  initial: T,
): [StateValue<T>, Dispatch<SetStateAction<StateValue<T>>>] {
  const [local, setLocal] = useState({ key, value: initial as StateValue<T> });
  const stored = p.ui?.[key];
  const value = (matches(stored, initial) ? stored : local.key === key ? local.value : initial) as StateValue<T>;
  const set: Dispatch<SetStateAction<StateValue<T>>> = (next) => {
    const updated =
      typeof next === "function" ? (next as (value: StateValue<T>) => StateValue<T>)(value) : next;
    setLocal({ key, value: updated });
    p.onUi?.(key, updated);
  };
  return [value, set];
}

export function useItemState(p: Pick<SkinProps, "ui" | "onUi" | "items">, key: string, initial: Item | null = null): [Item | null, (item: Item | null) => void] {
  const [id, setId] = useSkinState(p, key, initial?.id ?? "");
  const [local, setLocal] = useState(initial);
  const value = p.items.find((item) => item.id === id) ?? (local?.id === id ? local : null);
  return [value, (item) => { setLocal(item); setId(item?.id ?? ""); }];
}
