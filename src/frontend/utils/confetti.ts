import type { Options, Shape } from 'canvas-confetti';

// canvas-confetti (±4 KB gzip) hanya dimuat saat animasi pertama kali dipicu,
// bukan saat halaman dibuka.
type ConfettiFn = ((opts?: Options) => Promise<null> | null) & {
  shapeFromText?: (o: { text: string; scalar?: number }) => Shape;
};

let lib: ConfettiFn | null = null;
let loading: Promise<void> | null = null;
const ensure = () => (loading ??= import('canvas-confetti').then((m) => { lib = m.default as ConfettiFn; }));

export const confetti = Object.assign(
  (opts?: Options) => {
    if (lib) return lib(opts);
    ensure().then(() => lib?.(opts));
    return null;
  },
  {
    shapeFromText: (o: { text: string; scalar?: number }): Shape | 'circle' =>
      lib?.shapeFromText ? lib.shapeFromText(o) : 'circle',
  },
);

export default confetti;
