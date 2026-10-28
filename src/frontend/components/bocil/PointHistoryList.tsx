import React, { useCallback, useEffect, useState } from 'react';
import { Clock, TrendingDown, TrendingUp } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { Season } from '../../../shared/types';

const PAGE = 30;

type Row = { id: number; type: string; category?: string; points: number; reason: string; timestamp: string };

const TYPE_STYLE: Record<string, { icon: string; color: string }> = {
  adzan: { icon: '📢', color: 'bg-orange-100 text-orange-600 border-orange-200' },
  sholawat_iqomah: { icon: '📿', color: 'bg-teal-100 text-teal-600 border-teal-200' },
  attendance: { icon: '🏃', color: 'bg-sky-100 text-sky-600 border-sky-200' },
  quiz: { icon: '🎮', color: 'bg-purple-100 text-purple-600 border-purple-200' },
  bonus: { icon: '⭐', color: 'bg-sun-100 text-sun-700 border-sun-200' },
  game: { icon: '♟️', color: 'bg-rose-100 text-rose-600 border-rose-200' },
  adjustment: { icon: '🛠️', color: 'bg-mint-100 text-mint-700 border-mint-200' },
  redeem: { icon: '🎁', color: 'bg-rose-100 text-rose-600 border-rose-200' },
};

/**
 * Riwayat poin satu anak di season berjalan, langsung dari ledger
 * `transactions`, dimuat per 30 baris. Saldo berjalan dihitung mundur dari
 * saldo tersimpan sehingga tetap benar walau halaman lama belum dimuat.
 */
export const PointHistoryList: React.FC<{
  participantId: string | number;
  season: Season | null;
  currentBalance: number;
  ledgerReady: boolean;
}> = ({ participantId, season, currentBalance, ledgerReady }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const loadPage = useCallback(async (offset: number) => {
    setLoading(true);
    let q = supabase
      .from('transactions')
      .select(ledgerReady ? 'id,type,category,points,reason,timestamp' : 'id,type,points,reason,timestamp')
      .eq('participant_id', participantId)
      .order('timestamp', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + PAGE - 1);
    if (season) {
      q = ledgerReady ? q.eq('season_id', season.id) : q.gte('timestamp', season.startDate.toISOString());
    }
    const { data } = await q;
    const page = (data ?? []) as unknown as Row[];
    setRows((prev) => (offset === 0 ? page : [...prev, ...page]));
    setDone(page.length < PAGE);
    setLoading(false);
  }, [participantId, season, ledgerReady]);

  useEffect(() => { loadPage(0); }, [loadPage]);

  let running = currentBalance;
  const withBalance = rows.map((r) => {
    const after = running;
    running -= r.points;
    return { ...r, before: running, after };
  });

  if (!loading && rows.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <div className="text-4xl mb-2" aria-hidden>👻</div>
        <p className="font-bold">Belum ada riwayat poin di season ini.</p>
      </div>
    );
  }

  return (
    <div>
      <ul className="relative border-l-2 border-sky-100 pl-4 ml-2 space-y-3">
        {withBalance.map((tx) => {
          const style = TYPE_STYLE[tx.category || tx.type] ?? TYPE_STYLE.adjustment;
          const positive = tx.points > 0;
          const Icon = positive ? TrendingUp : tx.points === 0 ? Clock : TrendingDown;
          return (
            <li key={tx.id} className="relative">
              <span className={`absolute -left-[25px] mt-1.5 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${positive ? 'bg-mint-500' : tx.points === 0 ? 'bg-slate-400' : 'bg-rose-500'}`}>
                <Icon className="w-3 h-3 text-white" aria-hidden />
              </span>
              <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex gap-2 items-start min-w-0">
                    <span className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 text-sm ${style.color}`} aria-hidden>{style.icon}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm break-words">{tx.reason}</p>
                      <p className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" aria-hidden />
                        {new Date(tx.timestamp).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className={`font-black px-2.5 py-1 rounded-lg text-sm border ${positive ? 'bg-mint-50 text-mint-700 border-mint-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                      {positive ? '+' : ''}{tx.points}
                    </span>
                    {ledgerReady && (
                      <span className="text-[10px] text-slate-400 font-bold mt-1 tabular-nums">{tx.before} ➔ {tx.after}</span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {!done && (
        <button
          onClick={() => loadPage(rows.length)}
          disabled={loading}
          className="mt-4 w-full bocil-btn-secondary text-sm"
        >
          {loading ? 'Memuat...' : 'Muat riwayat sebelumnya'}
        </button>
      )}
    </div>
  );
};
