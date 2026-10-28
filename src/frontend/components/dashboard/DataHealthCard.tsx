import React, { useState } from 'react';
import { Database, ImageDown, ShieldCheck } from 'lucide-react';
import { Card } from '../ui/index';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../services/supabase';

type ReconcileRow = { nama: string | null; stored_balance: number; ledger_balance: number; diff: number; note: string | null };
type SizeRow = { table_name: string; row_estimate: number; total_pretty: string };

/** Panel admin: status ledger poin, rekonsiliasi saldo, ukuran tabel, dan kompres foto. */
export const DataHealthCard: React.FC = () => {
  const { ledgerReady, optimizeAvatars, participants, showToast } = useApp();
  const [recon, setRecon] = useState<ReconcileRow[] | null>(null);
  const [sizes, setSizes] = useState<SizeRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  const heavyAvatars = participants.filter(p => p.avatar_url && !p.avatar_url.split('?')[0].endsWith('.webp')).length;

  const runReconcile = async () => {
    setBusy('recon');
    const [{ data: r, error }, { data: sz }] = await Promise.all([
      supabase.rpc('reconcile_points'),
      supabase.rpc('storage_report'),
    ]);
    setBusy(null);
    if (error) { showToast(`Rekonsiliasi gagal: ${error.message}`, 'error'); return; }
    setRecon((r ?? []) as ReconcileRow[]);
    setSizes(((sz ?? []) as SizeRow[]).slice(0, 8));
  };

  const runOptimize = async () => {
    if (!confirm(`Kecilkan ${heavyAvatars} foto profil menjadi ±256px WebP? File asli tetap disimpan di Storage.`)) return;
    setBusy('avatar');
    const res = await optimizeAvatars((d, t) => setProgress(`${d}/${t}`));
    setBusy(null); setProgress('');
    showToast(`${res.optimized} foto dioptimalkan, hemat ±${(res.savedBytes / 1048576).toFixed(1)} MB per kunjungan${res.failed ? `, ${res.failed} gagal` : ''}.`, res.failed ? 'info' : 'success');
  };

  return (
    <Card className="md:col-span-2">
      <h2 className="font-bold text-gray-900 font-heading mb-4 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-sky-600" /> Kesehatan Data Poin
      </h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className={ledgerReady ? 'rounded-xl p-4 bg-mint-50 border border-mint-200' : 'rounded-xl p-4 bg-amber-50 border border-amber-200'}>
          <p className="font-semibold text-gray-900">{ledgerReady ? '✅ Saldo tersimpan di server' : '⚠️ Mode lama (migrasi belum dijalankan)'}</p>
          <p className="text-sm text-gray-600 mt-1">
            {ledgerReady
              ? 'Poin dihitung dari ledger append-only. Menghapus log aktivitas tidak mengubah saldo.'
              : 'Poin masih dihitung ulang dari log. Jalankan supabase/migrations/…_points_ledger.sql.'}
          </p>
          {ledgerReady && (
            <Button variant="outline" className="mt-3" onClick={runReconcile} disabled={busy === 'recon'}>
              <Database className="w-4 h-4 mr-1.5" /> {busy === 'recon' ? 'Memeriksa...' : 'Cek rekonsiliasi & ukuran'}
            </Button>
          )}
        </div>

        <div className="rounded-xl p-4 bg-sky-50 border border-sky-200">
          <p className="font-semibold text-gray-900">🖼️ Foto profil</p>
          <p className="text-sm text-gray-600 mt-1">
            {heavyAvatars > 0
              ? `${heavyAvatars} foto masih ukuran asli kamera (bisa 1–3 MB) dan diunduh setiap pengunjung.`
              : 'Semua foto sudah ringan.'}
          </p>
          {heavyAvatars > 0 && (
            <Button variant="outline" className="mt-3" onClick={runOptimize} disabled={busy === 'avatar'}>
              <ImageDown className="w-4 h-4 mr-1.5" /> {busy === 'avatar' ? `Memproses ${progress}` : 'Optimalkan foto'}
            </Button>
          )}
        </div>
      </div>

      {recon && (
        <div className="mt-4 text-sm">
          {recon.length === 0 ? (
            <p className="text-mint-700 font-semibold">✅ Semua saldo cocok dengan ledger.</p>
          ) : (
            <ul className="space-y-1">
              {recon.map((r, i) => (
                <li key={i} className="bg-amber-50 rounded-lg px-3 py-2">
                  <b>{r.nama ?? '—'}</b>: tersimpan {r.stored_balance}, ledger {r.ledger_balance}
                  {r.diff !== 0 && <span className="text-red-600"> (selisih {r.diff})</span>}
                  {r.note && <span className="text-amber-700"> · {r.note}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {sizes && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {sizes.map(s => (
            <div key={s.table_name} className="bg-gray-50 rounded-lg p-2">
              <p className="font-semibold text-gray-800 truncate">{s.table_name}</p>
              <p className="text-gray-500">{s.total_pretty} · ±{Math.max(0, s.row_estimate)} baris</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
