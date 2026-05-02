import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { cn } from "../../utils/cn";
import { AdzanEntry, Participant } from "../../../shared/types";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Award, Mic, CheckCircle2, BookOpen } from "lucide-react";

// ─── Animated Counter ─────────────────────────────────────────────────────────
const AnimatedNumber: React.FC<{ target: number; duration?: number }> = ({
  target,
  duration = 1200,
}) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setValue(target);
        clearInterval(timer);
      } else setValue(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <span>{value}</span>;
};

// ─── Sparkle effect ──────────────────────────────────────────────────────────
const Sparkles: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="sparkle"
        style={{
          left: `${15 + i * 15}%`,
          top: `${20 + (i % 3) * 25}%`,
          animationDelay: `${i * 0.4}s`,
        }}
      >
        ✨
      </div>
    ))}
  </div>
);

// ─── Medal Component ──────────────────────────────────────────────────────────
const Medal: React.FC<{ rank: number }> = ({ rank }) => {
  const medals = ["🥇", "🥈", "🥉"];
  if (rank < 3)
    return <span className="text-3xl drop-shadow-md">{medals[rank]}</span>;
  return (
    <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
      {rank + 1}
    </span>
  );
};

// ─── Pangkat (Rank) System ───────────────────────────────────────────────────
const PANGKAT_LEVELS = [
  {
    min: 0,
    title: "Prajurit Masjid",
    emoji: "🪖",
    color: "from-gray-400 to-gray-500",
    border: "border-gray-200",
    bg: "bg-gray-50",
  },
  {
    min: 50,
    title: "Kopral Adzan",
    emoji: "⭐",
    color: "from-blue-400 to-blue-600",
    border: "border-blue-200",
    bg: "bg-blue-50",
  },
  {
    min: 100,
    title: "Sersan Sholat",
    emoji: "⭐⭐",
    color: "from-teal-400 to-teal-600",
    border: "border-teal-200",
    bg: "bg-teal-50",
  },
  {
    min: 200,
    title: "Letnan Ibadah",
    emoji: "🌟",
    color: "from-emerald-400 to-emerald-600",
    border: "border-emerald-200",
    bg: "bg-emerald-50",
  },
  {
    min: 300,
    title: "Kapten Dakwah",
    emoji: "🌟🌟",
    color: "from-purple-400 to-purple-600",
    border: "border-purple-200",
    bg: "bg-purple-50",
  },
  {
    min: 400,
    title: "Mayor Muadzin",
    emoji: "🏅",
    color: "from-orange-400 to-orange-600",
    border: "border-orange-200",
    bg: "bg-orange-50",
  },
  {
    min: 500,
    title: "Jenderal Masjid",
    emoji: "👑",
    color: "from-yellow-400 to-amber-500",
    border: "border-yellow-200",
    bg: "bg-yellow-50",
  },
];

const getPangkat = (totalPoints: number) => {
  let current = PANGKAT_LEVELS[0];
  let next = PANGKAT_LEVELS[1];
  for (let i = PANGKAT_LEVELS.length - 1; i >= 0; i--) {
    if (totalPoints >= PANGKAT_LEVELS[i].min) {
      current = PANGKAT_LEVELS[i];
      next = PANGKAT_LEVELS[i + 1] || null;
      break;
    }
  }
  return { current, next };
};

export const BocilDashboard: React.FC = () => {
  const { participants, points, adzanLog, attendanceLog, quizAttempts } =
    useApp();
  const [selectedUser, setSelectedUser] = useState<string | null>(() =>
    localStorage.getItem("bocil_id"),
  );
  const [viewParticipant, setViewParticipant] = useState<Participant | null>(
    null,
  );

  useEffect(() => {
    if (selectedUser) localStorage.setItem("bocil_id", selectedUser);
    else localStorage.removeItem("bocil_id");
  }, [selectedUser]);

  // Leaderboard logic
  const leaderboard = [...participants]
    .filter((p) => p.status === "aktif")
    .sort(
      (a, b) =>
        (points[String(b.id)]?.total ?? 0) - (points[String(a.id)]?.total ?? 0),
    );

  // Motivational messages
  const motivations = [
    "🌟 Yuk semangat adzan hari ini!",
    "💪 Kumpulkan poin sebanyak-banyaknya!",
    "🕌 Sholat berjamaah = pahala 27x lipat!",
    "📖 Jangan lupa kerjakan quiz-nya ya!",
    "🏆 Siapa yang paling rajin bulan ini?",
  ];
  const [motivIdx, setMotivIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setMotivIdx((i: number) => (i + 1) % motivations.length),
      4000,
    );
    return () => clearInterval(t);
  }, []);

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? "Selamat Pagi"
      : hour < 15
        ? "Selamat Siang"
        : hour < 18
          ? "Selamat Sore"
          : "Selamat Malam";
  const greetingEmoji =
    hour < 12 ? "🌅" : hour < 15 ? "☀️" : hour < 18 ? "🌇" : "🌙";

  const myStats = selectedUser ? points[String(selectedUser)] : null;
  const myInfo = selectedUser
    ? participants.find((p) => String(p.id) === String(selectedUser))
    : null;
  const { current: myPangkat, next: myNextPangkat } = myStats
    ? getPangkat(myStats.total)
    : { current: null, next: null };
  const recentAdzan = adzanLog.slice(0, 8);

  return (
    <div className="bocil-page">
      {/* Hero Section */}
      <div className="bocil-hero mb-8">
        <Sparkles />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <p className="text-lg sm:text-xl text-white/80 mb-2 font-medium animate-fade-in">
              {greetingEmoji} {greeting},{" "}
              {myInfo ? myInfo.nama.split(" ")[0] : "Bocil Masjid"}!
            </p>
            <h1
              className="text-3xl sm:text-5xl font-extrabold text-white font-heading mb-3 animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              Adzan<span className="text-yellow-300">Challenge</span> 🏆
            </h1>
          </div>

          {/* User Selector / My Progress */}
          <div
            className="w-full md:w-auto animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            {selectedUser && myStats && myPangkat ? (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 text-white min-w-[320px]">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-xl bg-gradient-to-br shrink-0 border-2 border-white/30 overflow-hidden",
                      myPangkat?.color || "from-gray-400 to-gray-500",
                    )}
                  >
                    {myInfo?.avatar_url ? (
                      <img
                        src={myInfo.avatar_url}
                        alt={myInfo.nama}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      myInfo?.nama.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-white/20 px-3 py-1 rounded-xl border border-white/20 inline-block mb-2 shadow-sm">
                      <p className="text-sm font-black text-white truncate">
                        {myInfo?.nama}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary-200">
                        Pangkat Kamu
                      </p>
                      <p className="text-xl font-black font-heading leading-tight">
                        {myPangkat?.emoji || "🪖"}{" "}
                        {myPangkat?.title || "Prajurit Masjid"}
                      </p>
                      <p className="text-xs font-bold text-yellow-300">
                        ✨ {myStats?.total || 0} Total Poin
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors shrink-0 group"
                  >
                    <span className="text-[10px] font-black text-white/50 group-hover:text-white uppercase">
                      Ganti
                    </span>
                  </button>
                </div>

                {myNextPangkat ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className="text-primary-100">
                        Ke {myNextPangkat.title}
                      </span>
                      <span className="text-yellow-300">
                        {myNextPangkat.min - myStats.total} poin lagi!
                      </span>
                    </div>
                    <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden border border-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-300 to-amber-400 rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.min(100, Math.round(((myStats.total - myPangkat.min) / (myNextPangkat.min - myPangkat.min)) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-xs font-black text-yellow-300 animate-pulse">
                    👑 PANGKAT TERTINGGI! MASYAA ALLAH!
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 text-white text-center">
                <p className="text-sm font-bold mb-4">
                  Ayo mulai berburu pahala! 🔥
                </p>
                <select
                  className="bg-white/20 border border-white/30 rounded-xl px-4 py-2.5 text-white outline-none w-full appearance-none cursor-pointer hover:bg-white/30 transition-all font-bold"
                  value={selectedUser || ""}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="" className="text-gray-900">
                    Pilih Nama Kamu...
                  </option>
                  {participants
                    .filter((p) => p.status === "aktif")
                    .map((p) => (
                      <option key={p.id} value={p.id} className="text-gray-900">
                        {p.nama}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Motivational Ticker */}
      <div className="bocil-ticker mb-8">
        <div className="bocil-ticker-inner" key={motivIdx}>
          {motivations[motivIdx]}
        </div>
      </div>

      {/* Main Grid: Leaderboard & Recent Adzan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Leaderboard (8 cols) */}
        <div className="lg:col-span-8">
          <div className="bocil-card h-full">
            <div className="bocil-card-header">
              <h2 className="bocil-card-title">🏅 Papan Peringkat</h2>
              <span className="bocil-badge-gold">Top {leaderboard.length}</span>
            </div>

            {/* Top 3 Podium */}
            {leaderboard.length > 0 && (
              <div className="flex items-end justify-center gap-3 sm:gap-6 py-6 mb-8">
                {/* 2nd Place */}
                {leaderboard.length >= 2 && (
                  <div
                    onClick={() => setViewParticipant(leaderboard[1])}
                    className={cn(
                      "bocil-podium-item animate-fade-in cursor-pointer group",
                      selectedUser === leaderboard[1].id && "scale-110 z-20",
                    )}
                    style={{ animationDelay: "0.2s" }}
                  >
                    <div
                      className={cn(
                        "bocil-avatar bg-gradient-to-br from-gray-300 to-gray-400 text-xl sm:text-2xl w-14 h-14 sm:w-16 sm:h-16 group-hover:scale-110 transition-transform relative overflow-hidden",
                        selectedUser === leaderboard[1].id &&
                          "ring-4 ring-pink-400 shadow-[0_0_25px_rgba(236,72,153,0.4)]",
                      )}
                    >
                      {leaderboard[1].avatar_url ? (
                        <img
                          src={leaderboard[1].avatar_url}
                          alt={leaderboard[1].nama}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        leaderboard[1].nama.charAt(0)
                      )}
                      {selectedUser === leaderboard[1].id && (
                        <div className="absolute -top-3 -right-3 animate-bounce bg-pink-500 text-[9px] font-black px-2 py-1 rounded-full text-white ring-2 ring-white shadow-md whitespace-nowrap">
                          🌟 AKU!
                        </div>
                      )}
                    </div>
                    <Medal rank={1} />
                    <p
                      className={cn(
                        "text-xs sm:text-sm font-bold truncate max-w-[80px] sm:max-w-[100px]",
                        selectedUser === leaderboard[1].id
                          ? "text-pink-600"
                          : "text-gray-800",
                      )}
                    >
                      {leaderboard[1].nama.split(" ")[0]}
                    </p>
                    <div className="text-[10px] text-gray-500 font-medium">
                      {
                        getPangkat(points[leaderboard[1].id]?.total ?? 0)
                          .current.emoji
                      }{" "}
                      {
                        getPangkat(points[leaderboard[1].id]?.total ?? 0)
                          .current.title
                      }
                    </div>
                    <div className="bocil-podium h-16 sm:h-20 bg-gradient-to-t from-gray-200 to-gray-100 mt-2">
                      <span className="text-sm sm:text-base font-extrabold text-gray-700">
                        {points[leaderboard[1].id]?.total ?? 0}
                      </span>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                <div
                  onClick={() => setViewParticipant(leaderboard[0])}
                  className={cn(
                    "bocil-podium-item animate-fade-in cursor-pointer group",
                    selectedUser === leaderboard[0].id && "scale-110 z-20",
                  )}
                  style={{ animationDelay: "0.1s" }}
                >
                  <div
                    className={cn(
                      "bocil-avatar bg-gradient-to-br from-yellow-400 to-amber-500 text-2xl sm:text-3xl w-16 h-16 sm:w-20 sm:h-20 shadow-lg shadow-yellow-300/50 group-hover:scale-110 transition-transform relative overflow-hidden",
                      selectedUser === leaderboard[0].id
                        ? "ring-4 ring-pink-400"
                        : "ring-4 ring-yellow-200",
                    )}
                  >
                    {leaderboard[0].avatar_url ? (
                      <img
                        src={leaderboard[0].avatar_url}
                        alt={leaderboard[0].nama}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      leaderboard[0].nama.charAt(0)
                    )}
                    {selectedUser === leaderboard[0].id && (
                      <div className="absolute -top-4 -right-4 animate-bounce bg-pink-500 text-[11px] font-black px-2.5 py-1.5 rounded-full text-white ring-2 ring-white shadow-lg whitespace-nowrap">
                        👑 JAGOAN!
                      </div>
                    )}
                  </div>
                  <Medal rank={0} />
                  <p
                    className={cn(
                      "text-sm sm:text-base font-bold truncate max-w-[80px] sm:max-w-[120px]",
                      selectedUser === leaderboard[0].id
                        ? "text-pink-700"
                        : "text-gray-900",
                    )}
                  >
                    {leaderboard[0].nama.split(" ")[0]}
                  </p>
                  <div className="text-[10px] text-amber-600 font-bold">
                    {
                      getPangkat(points[leaderboard[0].id]?.total ?? 0).current
                        .emoji
                    }{" "}
                    {
                      getPangkat(points[leaderboard[0].id]?.total ?? 0).current
                        .title
                    }
                  </div>
                  <div className="bocil-podium h-24 sm:h-28 bg-gradient-to-t from-yellow-300 to-yellow-100 mt-2">
                    <span className="text-lg sm:text-xl font-extrabold text-yellow-700">
                      {points[leaderboard[0].id]?.total ?? 0}
                    </span>
                  </div>
                </div>

                {/* 3rd Place */}
                {leaderboard.length >= 3 && (
                  <div
                    onClick={() => setViewParticipant(leaderboard[2])}
                    className={cn(
                      "bocil-podium-item animate-fade-in cursor-pointer group",
                      selectedUser === leaderboard[2].id && "scale-110 z-20",
                    )}
                    style={{ animationDelay: "0.3s" }}
                  >
                    <div
                      className={cn(
                        "bocil-avatar bg-gradient-to-br from-orange-300 to-orange-400 text-xl sm:text-2xl w-14 h-14 sm:w-16 sm:h-16 group-hover:scale-110 transition-transform relative overflow-hidden",
                        selectedUser === leaderboard[2].id &&
                          "ring-4 ring-pink-400 shadow-[0_0_25px_rgba(236,72,153,0.4)]",
                      )}
                    >
                      {leaderboard[2].avatar_url ? (
                        <img
                          src={leaderboard[2].avatar_url}
                          alt={leaderboard[2].nama}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        leaderboard[2].nama.charAt(0)
                      )}
                      {selectedUser === leaderboard[2].id && (
                        <div className="absolute -top-3 -right-3 animate-bounce bg-pink-500 text-[9px] font-black px-2 py-1 rounded-full text-white ring-2 ring-white shadow-md whitespace-nowrap">
                          🌟 AKU!
                        </div>
                      )}
                    </div>
                    <Medal rank={2} />
                    <p
                      className={cn(
                        "text-xs sm:text-sm font-bold truncate max-w-[80px] sm:max-w-[100px]",
                        selectedUser === leaderboard[2].id
                          ? "text-pink-600"
                          : "text-gray-800",
                      )}
                    >
                      {leaderboard[2].nama.split(" ")[0]}
                    </p>
                    <div className="text-[10px] text-orange-600 font-medium">
                      {
                        getPangkat(points[leaderboard[2].id]?.total ?? 0)
                          .current.emoji
                      }{" "}
                      {
                        getPangkat(points[leaderboard[2].id]?.total ?? 0)
                          .current.title
                      }
                    </div>
                    <div className="bocil-podium h-12 sm:h-14 bg-gradient-to-t from-orange-200 to-orange-100 mt-2">
                      <span className="text-sm sm:text-base font-extrabold text-orange-700">
                        {points[leaderboard[2].id]?.total ?? 0}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              {leaderboard
                .slice(
                  leaderboard.length >= 3 ? 3 : leaderboard.length >= 2 ? 2 : 1,
                )
                .map((p, i) => {
                  const totalPts = points[p.id]?.total ?? 0;
                  const { current } = getPangkat(totalPts);
                  const rankOffset =
                    leaderboard.length >= 3
                      ? 3
                      : leaderboard.length >= 2
                        ? 2
                        : 1;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setViewParticipant(p)}
                      className={cn(
                        "bocil-leaderboard-row animate-fade-in cursor-pointer group hover:bg-primary-50 transition-all",
                        selectedUser === p.id &&
                          "bg-gradient-to-r from-pink-50 to-white border-pink-200 ring-2 ring-pink-100 shadow-[0_0_15px_rgba(236,72,153,0.15)]",
                      )}
                      style={{ animationDelay: `${(i + 4) * 0.05}s` }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                            selectedUser === p.id
                              ? "bg-pink-500 text-white animate-pulse"
                              : "bg-gray-100 text-gray-500",
                          )}
                        >
                          {i + 1 + rankOffset}
                        </span>
                        <div
                          className={cn(
                            "bocil-avatar-sm group-hover:scale-110 transition-transform overflow-hidden",
                            selectedUser === p.id
                              ? "bg-gradient-to-br from-pink-400 to-rose-400 shadow-md"
                              : "bg-gradient-to-br from-primary-400 to-teal-400",
                          )}
                        >
                          {p.avatar_url ? (
                            <img
                              src={p.avatar_url}
                              alt={p.nama}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            p.nama.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "font-bold text-sm transition-colors truncate",
                              selectedUser === p.id
                                ? "text-pink-600"
                                : "text-gray-800 group-hover:text-primary-600",
                            )}
                          >
                            {p.nama}{" "}
                            {selectedUser === p.id && (
                              <span className="ml-1 text-[9px] bg-pink-500 text-white px-2 py-0.5 rounded-full font-black italic shadow-sm animate-bounce inline-block">
                                🌟 AKU DISINI!
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                            {current.emoji} {current.title}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-primary-600">
                          {totalPts}{" "}
                          <span className="text-[10px] text-gray-400 font-normal">
                            pts
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Recent Adzan (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bocil-card bg-white h-full max-h-[600px] overflow-hidden flex flex-col">
            <div className="bocil-card-header">
              <h2 className="bocil-card-title">🎤 Adzan Terbaru</h2>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {recentAdzan.map((a, i) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm",
                      a.attitude === "Bagus"
                        ? "bg-emerald-500"
                        : a.attitude === "Cukup Bagus"
                          ? "bg-yellow-500"
                          : "bg-red-500",
                    )}
                  >
                    {a.participantName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">
                      {a.participantName}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase font-black">
                      {a.prayerTime}
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-2 py-1 rounded-lg">
                    +{a.total}
                  </span>
                </div>
              ))}
              {recentAdzan.length === 0 && (
                <div className="text-center py-12">
                  <span className="text-4xl block mb-2">🎤</span>
                  <p className="text-gray-400 text-xs italic">
                    Belum ada adzan hari ini.
                    <br />
                    Ayo jadi muadzin pertama! ✨
                  </p>
                </div>
              )}
            </div>

            <div className="bocil-fun-fact mt-4">
              <div className="text-2xl mb-1">🕌</div>
              <h3 className="font-bold text-white text-sm mb-1">
                Pahala Muadzin
              </h3>
              <p className="text-[10px] text-white/80 leading-tight italic">
                "Jika manusia tahu pahala adzan, mereka akan berebut sampai
                mengundi untuk melakukannya." (HR. Bukhari & Muslim)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Education (How to Rank & Points) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Rank Guide */}
        <div className="bocil-card">
          <div className="bocil-card-header border-b pb-4 mb-6">
            <h2 className="bocil-card-title">🎖️ Jenjang Pangkat Masjid</h2>
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
              Target Prestasi
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PANGKAT_LEVELS.map((pl, idx) => (
              <div
                key={pl.title}
                className={cn(
                  "relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all group overflow-hidden",
                  myPangkat?.title === pl.title
                    ? "bg-amber-50 border-amber-400 shadow-lg scale-105 z-10"
                    : "bg-white border-gray-100 hover:border-primary-200",
                )}
              >
                {myPangkat?.title === pl.title && (
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-400"></div>
                )}
                <span className="text-3xl mb-1 group-hover:scale-125 transition-transform duration-300">
                  {pl.emoji}
                </span>
                <span className="text-[10px] font-black text-gray-800 text-center uppercase tracking-tighter mb-1 leading-none">
                  {pl.title}
                </span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 rounded-full">
                  {pl.min} Pts
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* How to get Points */}
        <div className="bocil-card">
          <div className="bocil-card-header border-b pb-4 mb-6">
            <h2 className="bocil-card-title">📊 Cara Mengumpulkan Poin</h2>
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
              Misi Ibadah
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: "Kumandangkan Adzan",
                points: "+10 Poin",
                extra: "Poin Tetap",
                emoji: "🎤",
                color: "text-emerald-600",
                bg: "bg-emerald-50",
              },
              {
                label: "Ikut Latihan Adzan",
                points: "+5 Poin",
                extra: "Bonus Sikap",
                emoji: "⭐",
                color: "text-yellow-600",
                bg: "bg-yellow-50",
              },
              {
                label: "Jawab Quiz Benar",
                points: "+1 Poin",
                extra: "Per Jawaban",
                emoji: "📝",
                color: "text-purple-600",
                bg: "bg-purple-50",
              },
            ].map((item) => (
              <div
                key={item.label}
                className={cn(
                  "flex flex-col items-center text-center p-4 rounded-2xl border border-transparent shadow-sm",
                  item.bg,
                )}
              >
                <span className="text-4xl mb-2">{item.emoji}</span>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight mb-1">
                  {item.label}
                </p>
                <p className={cn("text-xl font-black", item.color)}>
                  {item.points}
                </p>
                <p className="text-[9px] text-gray-400 font-medium">
                  {item.extra}
                </p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-6 italic">
            Semangat kumpulkan poin untuk naik pangkat dan jadi Jenderal Masjid!
            ✨
          </p>
        </div>
      </div>

      {/* Participant Detail Modal */}
      {viewParticipant && (
        <Modal
          isOpen={!!viewParticipant}
          onClose={() => setViewParticipant(null)}
          title="Rincian Prestasi"
          size="sm"
        >
          <div className="p-2 space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-3xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-4xl overflow-hidden shadow-inner border-2 border-white">
                {viewParticipant.avatar_url ? (
                  <img
                    src={viewParticipant.avatar_url}
                    alt={viewParticipant.nama}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  viewParticipant.nama.charAt(0)
                )}
              </div>
              <h3 className="text-2xl font-black text-gray-900 font-heading">
                {viewParticipant.nama}
              </h3>
              <div className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700">
                <span className="text-xl">
                  {
                    getPangkat(points[viewParticipant.id]?.total ?? 0).current
                      .emoji
                  }
                </span>
                <span className="font-bold text-sm uppercase tracking-wider">
                  {
                    getPangkat(points[viewParticipant.id]?.total ?? 0).current
                      .title
                  }
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                {
                  label: "Total Poin",
                  value: points[viewParticipant.id]?.total ?? 0,
                  icon: Award,
                  color: "text-amber-600",
                  bg: "bg-amber-50",
                },
                {
                  label: "Adzan",
                  value: points[viewParticipant.id]?.adzanCount ?? 0,
                  icon: Mic,
                  color: "text-primary-600",
                  bg: "bg-primary-50",
                },
                {
                  label: "Latihan",
                  value: points[viewParticipant.id]?.attendanceCount ?? 0,
                  icon: CheckCircle2,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
                {
                  label: "Quiz",
                  value: points[viewParticipant.id]?.quiz ?? 0,
                  icon: BookOpen,
                  color: "text-purple-600",
                  bg: "bg-purple-50",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "p-4 rounded-2xl border border-transparent",
                    item.bg,
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <item.icon className={cn("w-4 h-4", item.color)} />
                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                      {item.label}
                    </span>
                  </div>
                  <p className="text-2xl font-black text-gray-900">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Next Rank Progress in Modal */}
            {getPangkat(points[viewParticipant.id]?.total ?? 0).next && (
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6">
                <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                  <span className="text-gray-400">
                    Target Selanjutnya:{" "}
                    {
                      getPangkat(points[viewParticipant.id]?.total ?? 0).next
                        ?.title
                    }
                  </span>
                  <span className="text-primary-600">
                    {getPangkat(points[viewParticipant.id]?.total ?? 0).next!
                      .min - (points[viewParticipant.id]?.total ?? 0)}{" "}
                    poin lagi
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min(100, Math.round((((points[viewParticipant.id]?.total ?? 0) - getPangkat(points[viewParticipant.id]?.total ?? 0).current.min) / (getPangkat(points[viewParticipant.id]?.total ?? 0).next!.min - getPangkat(points[viewParticipant.id]?.total ?? 0).current.min)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <Button
              onClick={() => setViewParticipant(null)}
              className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-2xl transition-all active:scale-95"
            >
              TUTUP
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
