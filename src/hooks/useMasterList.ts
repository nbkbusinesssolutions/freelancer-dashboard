import * as React from "react";

function normalizeValue(value: string) {
  return value.trim();
}

function uniqCaseInsensitive(values: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const n = normalizeValue(v);
    if (!n) continue;
    const key = n.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}

export function useMasterList(storageKey: string, defaults: string[]) {
  const [items, setItems] = React.useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return uniqCaseInsensitive(defaults);
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return uniqCaseInsensitive(defaults);
      return uniqCaseInsensitive([...defaults, ...parsed.map(String)]);
    } catch {
      return uniqCaseInsensitive(defaults);
    }
  });

  const persist = React.useCallback(
    (next: string[]) => {
      setItems(next);
      try {
        // Store only non-default custom values
        const def = new Set(defaults.map((d) => d.toLowerCase()));
        const custom = next.filter((v) => !def.has(v.toLowerCase()));
        localStorage.setItem(storageKey, JSON.stringify(custom));
      } catch {
        // ignore
      }
    },
    [defaults, storageKey],
  );

  const addItem = React.useCallback(
    (value: string) => {
      const v = normalizeValue(value);
      if (!v) return;
      const key = v.toLowerCase();
      persist(uniqCaseInsensitive([v, ...items.filter((i) => i.toLowerCase() !== key)]));
    },
    [items, persist],
  );

  return { items, addItem };
}
