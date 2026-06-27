import React, { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { Trophy, Star, Search, Award, CalendarDays, Medal, PartyPopper } from "lucide-react";
import { cn } from "../utils/cn";
import confetti from "canvas-confetti";

export const SeasonHistoryPage: React.FC = () => {
  const { seasonHistory, participants, allSeasons } = useApp();
  const [search, setSearch] = useState("");

  const handleCelebrate = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  // Group history by season
  const groupedHistory = useMemo(() => {
    const groups = new Map<string, typeof seasonHistory>();
    
    // Sort seasons by start date descending
    const sortedSeasons = [...allSeasons].sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
    
    sortedSeasons.forEach(season => {
      const historyForSeason = seasonHistory.filter(h => h.seasonId === season.id);
      if (historyForSeason.length > 0) {
        // Apply search filter if any
        let filtered = historyForSeason;
        if (search) {
          filtered = filtered.filter(h => {
            const participant = participants.find(p => String(p.id) === String(h.participantId));
            return participant?.nama.toLowerCase().includes(search.toLowerCase());
          });
        }
        
        if (filtered.length > 0) {
          groups.set(season.id, filtered.sort((a, b) => a.rank - b.rank));
        }
      }
    });
    
    return groups;
  }, [seasonHistory, allSeasons, search, participants]);

  const renderBadge = (badge: string | undefined | null) => {
    if (badge === 'gold') return <Trophy className="w-10 h-10 sm:w-16 sm:h-16 text-yellow-500 drop-shadow-lg" />;
    if (badge === 'silver') return <Trophy className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 drop-shadow-lg" />;
    if (badge === 'bronze') return <Trophy className="w-8 h-8 sm:w-12 sm:h-12 text-amber-600 drop-shadow-lg" />;
    return <Award className="w-6 h-6 text-gray-300" />;
  };

  const getBadgeBg = (badge: string | undefined | null) => {
    if (badge === 'gold') return 'bg-gradient-to-br from-yellow-50 via-yellow-100 to-amber-200 border-yellow-300 shadow-yellow-200/50';
    if (badge === 'silver') return 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 border-gray-300 shadow-gray-200/50';
    if (badge === 'bronze') return 'bg-gradient-to-br from-amber-50 via-amber-100 to-orange-200 border-amber-300 shadow-amber-200/50';
    return 'bg-white border-gray-100';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in p-4 sm:p-6 pb-24">
      {/* Header */}
      <div className="text-center space-y-4 mb-10 mt-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl -z-10" />
        
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-yellow-100 to-amber-300 mb-2 shadow-2xl shadow-yellow-200/50 transform rotate-3 hover:rotate-12 transition-transform cursor-pointer" onClick={handleCelebrate}>
            <Trophy className="w-12 h-12 text-yellow-600" />
          </div>
          <h1 className="text-5xl font-black font-heading text-gray-900 tracking-tight drop-shadow-sm">
            Papan Juara <span className="text-yellow-500">🏆</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto font-medium">
            Mengenang para legenda adzan dari setiap musim.
          </p>
          
          <button 
            onClick={handleCelebrate}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white rounded-full font-bold shadow-xl shadow-orange-500/30 flex items-center gap-2 transform transition-all hover:scale-105 active:scale-95"
          >
            <PartyPopper className="w-5 h-5" />
            Rayakan Juara!
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-sm border border-gray-100 sticky top-20 z-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari pahlawan adzan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-transparent border-none rounded-xl focus:ring-2 focus:ring-primary-500/20 text-base font-medium"
          />
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-16">
        {groupedHistory.size === 0 ? (
          <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-gray-100 border-dashed">
            <Medal className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Riwayat Juara</h3>
            <p className="text-gray-500">Season pertama sedang berjalan. Ayo kumpulkan poin sebanyak-banyaknya!</p>
          </div>
        ) : (
          Array.from(groupedHistory.entries()).map(([seasonId, history]) => {
            const season = allSeasons.find(s => s.id === seasonId);
            if (!season) return null;
            
            return (
              <div key={seasonId} className="space-y-8 animate-fade-in bg-white/40 p-6 rounded-3xl border border-white/60 shadow-xl shadow-gray-200/40">
                {/* Season Title */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b-4 border-gray-200/50 px-2">
                  <h2 className="text-3xl font-black font-heading text-gray-900 flex items-center gap-3">
                    <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                    {season.name}
                  </h2>
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-100 px-4 py-2 rounded-full w-fit shadow-inner border border-emerald-200">
                    <CalendarDays className="w-5 h-5" />
                    <span>{formatDate(season.startDate)} - {season.endDate ? formatDate(season.endDate) : 'Sekarang'}</span>
                  </div>
                </div>

                {/* Top 3 Podium (Always 3 columns even on mobile) */}
                <div className="grid grid-cols-3 gap-2 sm:gap-6 pt-8 pb-4 items-end">
                  {/* Top 2 - Silver */}
                  {history[1] && (
                    <div className="order-1 mb-4 sm:mb-12">
                      <WinnerCard history={history[1]} participant={participants.find(p => String(p.id) === String(history[1].participantId))} getBadgeBg={getBadgeBg} renderBadge={renderBadge} />
                    </div>
                  )}
                  
                  {/* Top 1 - Gold (SIUUU) */}
                  {history[0] && (
                    <div className="order-2 z-10 transform -translate-y-4 sm:-translate-y-8">
                      <WinnerCard history={history[0]} participant={participants.find(p => String(p.id) === String(history[0].participantId))} getBadgeBg={getBadgeBg} renderBadge={renderBadge} isGold={true} />
                    </div>
                  )}
                  
                  {/* Top 3 - Bronze */}
                  {history[2] && (
                    <div className="order-3 mb-0 sm:mb-16">
                      <WinnerCard history={history[2]} participant={participants.find(p => String(p.id) === String(history[2].participantId))} getBadgeBg={getBadgeBg} renderBadge={renderBadge} />
                    </div>
                  )}
                </div>

                {/* Rest of the list */}
                {history.length > 3 && (
                  <div className="grid gap-3 pt-6 mt-6 border-t-2 border-gray-200/50 border-dashed">
                    <h3 className="text-lg font-bold text-gray-500 mb-2 px-2">Top 10 Lainnya</h3>
                    {history.slice(3).map((h) => {
                      const participant = participants.find(p => String(p.id) === String(h.participantId));
                      
                      return (
                        <div 
                          key={h.id}
                          className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:shadow-md transition-shadow"
                        >
                          <div className="w-10 text-center font-black text-xl text-gray-400 shrink-0">
                            #{h.rank}
                          </div>
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                            <img 
                              src={participant?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant?.nama}`} 
                              alt={participant?.nama}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-700 text-base truncate">{participant?.nama || 'Peserta Tidak Ditemukan'}</h3>
                            <div className="text-sm font-bold text-primary-500/80">{h.finalPoints} Pts</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const WinnerCard = ({ history, participant, getBadgeBg, renderBadge, isGold = false }: any) => {
  return (
    <div className="flex flex-col items-center">
      {/* The floating card */}
      <div className={cn(
        "relative rounded-t-3xl rounded-b-xl p-3 sm:p-6 flex flex-col items-center text-center transition-all duration-700 hover:-translate-y-4 border-t-2 border-l-2 shadow-2xl w-full",
        getBadgeBg(history.badge),
        isGold ? "border-yellow-300 shadow-yellow-500/50 z-20 scale-[1.05] sm:scale-110 bg-gradient-to-b from-yellow-100 via-yellow-300 to-amber-500" : ""
      )}>
        {/* Glow effect behind Top 1 */}
        {isGold && (
          <div className="absolute inset-0 bg-yellow-400/20 blur-2xl rounded-full -z-10 animate-pulse"></div>
        )}

        {isGold && (
          <div className="absolute -top-10 sm:-top-16 left-1/2 -translate-x-1/2 whitespace-nowrap z-30 flex flex-col items-center">
            <span className="text-4xl sm:text-6xl mb-1 animate-bounce">👑</span>
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white font-black text-xs sm:text-2xl lg:text-3xl px-3 py-1 sm:px-6 sm:py-2 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.6)] transform -rotate-3 animate-pulse border-2 sm:border-4 border-yellow-300 tracking-wider">
              SIUUU! 🐐
            </div>
          </div>
        )}
        
        <div className="absolute -top-4 -right-2 sm:-top-8 sm:-right-8 transform rotate-12 scale-75 sm:scale-110 z-20">
          {renderBadge(history.badge)}
        </div>
        
        <div className={cn(
          "rounded-full overflow-hidden bg-white shadow-[0_10px_20px_rgba(0,0,0,0.2)] mb-3 sm:mb-5 border-2 sm:border-4 shrink-0 relative z-10",
          isGold ? "w-16 h-16 sm:w-36 sm:h-36 border-yellow-200 mt-5 sm:mt-8 ring-4 ring-yellow-400/50" : "w-12 h-12 sm:w-28 sm:h-28 border-white ring-2 ring-black/5"
        )}>
          <img 
            src={participant?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant?.nama}`} 
            alt={participant?.nama}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="w-full relative z-10 bg-white/40 backdrop-blur-sm py-2 px-1 rounded-2xl border border-white/50 shadow-inner">
          <h3 className={cn(
            "font-black text-gray-900 w-full px-1 drop-shadow-sm leading-tight break-words",
            isGold ? "text-[11px] sm:text-2xl mb-1" : "text-[10px] sm:text-xl"
          )}>
            {participant?.nama || 'Anonim'}
          </h3>
          
          <div className={cn(
            "mt-1 sm:mt-2 inline-flex items-center justify-center font-black rounded-full px-2 py-0.5 sm:px-5 sm:py-2 shadow-lg",
            isGold ? "bg-gradient-to-r from-yellow-600 to-yellow-500 text-white text-[10px] sm:text-xl border border-yellow-400" : "bg-white text-gray-800 text-[10px] sm:text-lg border border-gray-200"
          )}>
            {history.finalPoints} <span className="hidden sm:inline ml-1 opacity-80">Pts</span>
          </div>
        </div>

        {/* Top Global style sleek rank badge at the bottom */}
        <div className={cn(
          "absolute -bottom-4 sm:-bottom-6 left-1/2 -translate-x-1/2 rounded-full border-4 shadow-xl flex items-center justify-center font-black",
          history.rank === 1 ? "w-10 h-10 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-300 to-yellow-600 text-white border-yellow-100 text-lg sm:text-2xl" :
          history.rank === 2 ? "w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-300 to-gray-500 text-white border-gray-100 text-sm sm:text-xl" :
          "w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-600 to-orange-800 text-white border-amber-100 text-sm sm:text-xl"
        )}>
          #{history.rank}
        </div>
      </div>
    </div>
  );
};
