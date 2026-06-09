// Minimal declaration for the bundler-provided `import.meta.glob` so this
// package type-checks without depending on `vite/client`. Consumers that build
// with Vite supply the precise type; this only needs to satisfy `tsc`.
interface ImportMeta {
  glob(
    pattern: string,
    options?: { query?: string; eager?: boolean; import?: string },
  ): Record<string, unknown>;
}
