import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { cn } from "../../utils/cn";
import { AdzanEntry, Participant, PANGKAT_LEVELS, getPangkat } from "../../../shared/types";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Award, Mic, CheckCircle2, BookOpen, Star, AlignCenter } from "lucide-react";

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

export const BocilDashboard: React.FC = () => {
  const { participants, points, adzanLog, attendanceLog, quizAttempts, schedule, transactions } =
    useApp();
  const [selectedUser, setSelectedUser] = useState<string | null>(() =>
    localStorage.getItem("bocil_id"),
  );
  const [viewParticipant, setViewParticipant] = useState<Participant | null>(
    null,
  );
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>(() => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu"];
    const todayIndex = new Date().getDay();
    return days[todayIndex];
  });


  const myParticipant = useMemo(() => {
    return selectedUser ? participants.find(p => String(p.id) === String(selectedUser)) : null;
  }, [selectedUser, participants]);

  const myName = myParticipant ? myParticipant.nama : '';

  const myAssignedSlots = useMemo(() => {
    const slots: Array<{ day: string; prayer: string }> = [];
    if (myName) {
      Object.entries(schedule).forEach(([day, daySlots]) => {
        Object.entries(daySlots).forEach(([prayer, name]) => {
          if (name && name.toLowerCase() === myName.toLowerCase()) {
            slots.push({ day, prayer });
          }
        });
      });
    }
    return slots;
  }, [myName, schedule]);

  useEffect(() => {
    if (selectedUser) localStorage.setItem("bocil_id", selectedUser);
    else localStorage.removeItem("bocil_id");
  }, [selectedUser]);

  // Leaderboard logic
  const leaderboard = useMemo(() => {
    return [...participants]
      .filter((p) => p.status === "aktif")
      .sort(
        (a, b) =>
          (points[String(b.id)]?.total ?? 0) - (points[String(a.id)]?.total ?? 0),
      );
  }, [participants, points]);

  const activeModalRank = useMemo(() => {
    if (!viewParticipant) return null;
    return (
      leaderboard.findIndex(
        (p) => String(p.id) === String(viewParticipant.id),
      ) + 1
    );
  }, [viewParticipant, leaderboard]);

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

  const myStats = useMemo(() => {
    return selectedUser ? points[String(selectedUser)] : null;
  }, [selectedUser, points]);

  const myInfo = useMemo(() => {
    return selectedUser
      ? participants.find((p) => String(p.id) === String(selectedUser))
      : null;
  }, [selectedUser, participants]);

  const { current: myPangkat, next: myNextPangkat } = useMemo(() => {
    return myStats
      ? getPangkat(myStats.total)
      : { current: null, next: null };
  }, [myStats]);

  // Gabungkan adzan + latihan, sort terbaru dulu, ambil 10
  const recentActivity = useMemo(() => {
    const getPreciseTime = (item: any, type: string) => {
      if (item.createdAt) {
        return new Date(item.createdAt).getTime();
      }
      // Find transaction of same participant, type, and matching prayer time in reason
      const tx = transactions.find(t => 
        String(t.participantId) === String(item.participantId) &&
        t.type === type &&
        t.reason.toLowerCase().includes(item.prayerTime?.toLowerCase() || '')
      );
      return tx ? new Date(tx.timestamp).getTime() : new Date(item.date).getTime();
    };

    let filteredAdzan = adzanLog;
    let filteredAttendance = attendanceLog;

    if (selectedUser) {
      filteredAdzan = adzanLog.filter(a => String(a.participantId) === String(selectedUser));
      filteredAttendance = attendanceLog.filter(a => String(a.participantId) === String(selectedUser));
    }

    const adzanItems = filteredAdzan.map(a => {
      const time = getPreciseTime(a, 'adzan');
      return { ...a, _type: 'adzan' as const, _time: time };
    });

    const attendItems = filteredAttendance.map(a => {
      const time = getPreciseTime(a, 'attendance');
      return { ...a, _type: 'latihan' as const, _time: time };
    });

    return [...adzanItems, ...attendItems]
      .sort((a, b) => b._time - a._time)
      .slice(0, 10);
  }, [adzanLog, attendanceLog, transactions, selectedUser]);

  const neighboringFriends = useMemo(() => {
    if (!viewParticipant) return [];
    const idx = leaderboard.findIndex((p) => p.id === viewParticipant.id);
    if (idx === -1) return [];

    const neighbors = [];
    // Friend directly above
    if (idx > 0) {
      neighbors.push({
        p: leaderboard[idx - 1],
        rank: idx,
        rel: "above",
      });
    }
    // Self
    neighbors.push({
      p: leaderboard[idx],
      rank: idx + 1,
      rel: "self",
    });
    // Friend directly below
    if (idx < leaderboard.length - 1) {
      neighbors.push({
        p: leaderboard[idx + 1],
        rank: idx + 2,
        rel: "below",
      });
    }
    return neighbors;
  }, [viewParticipant, leaderboard]);

  const downloadLeaderboardImage = () => {
    // Select top 17 participants to fit on standard portrait mobile image size
    const limit = 17;
    const items = leaderboard.slice(0, limit);
    
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dimensions: optimized for mobile sharing with fully detailed columns (750 width!)
    const width = 750;
    const rowHeight = 44;
    const headerHeight = 135;
    const footerHeight = 70;
    const height = headerHeight + (items.length * rowHeight) + footerHeight;

    canvas.width = width;
    canvas.height = height;

    // 1. Draw premium background gradient (Navy Slate/Indigo look)
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "#0f172a"); // slate-900
    grad.addColorStop(1, "#1e1b4b"); // indigo-950
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle ambient decorative circle glow
    ctx.fillStyle = "rgba(99, 102, 241, 0.15)"; // Indigo glow
    ctx.beginPath();
    ctx.arc(width / 2, 0, 300, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(244, 63, 94, 0.08)"; // Pink glow at bottom
    ctx.beginPath();
    ctx.arc(width / 2, height, 250, 0, Math.PI * 2);
    ctx.fill();

    // 2. Draw Header
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 10;
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🏆 PAPAN KLASEMEN", width / 2, 50);

    ctx.shadowBlur = 0; // Reset shadow

    ctx.fillStyle = "#facc15"; // Yellow subtitle
    ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
    ctx.fillText("ADZAN & SHOLAWAT CHALLENGE 🕌", width / 2, 80);

    ctx.fillStyle = "#94a3b8"; // Gray date
    ctx.font = "500 11px system-ui, -apple-system, sans-serif";
    ctx.fillText(`Dicetak pada: ${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}`, width / 2, 102);

    // Draw Column Headers
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "bold 10px system-ui, -apple-system, sans-serif";
    
    ctx.textAlign = "center";
    ctx.fillText("NO", 60, 122);
    
    ctx.textAlign = "left";
    ctx.fillText("NAMA ANAK", 105, 122);
    ctx.fillText("GELAR PANGKAT", 235, 122);
    
    ctx.textAlign = "center";
    ctx.fillText("📢 ADZAN", 420, 122);
    ctx.fillText("📿 SHOLAWAT", 505, 122);
    ctx.fillText("🏃 LATIHAN", 590, 122);
    
    ctx.textAlign = "right";
    ctx.fillText("TOTAL POIN", 710, 122);

    // Draw Column Header Separator Line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 128);
    ctx.lineTo(width - 30, 128);
    ctx.stroke();

    // 3. Draw Rows
    let y = headerHeight;
    items.forEach((p, idx) => {
      const stats = points[String(p.id)] || {
        total: 0,
        adzanCount: 0,
        sholawatIqomahCount: 0,
        attendanceCount: 0,
        quizCount: 0,
      };
      const pangkat = getPangkat(stats.total).current;

      // Draw Alternating Background
      if (idx % 2 === 0) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
        ctx.fillRect(30, y - 5, width - 60, rowHeight);
      }

      // Rank Medal or Number (Guaranteed Vector Badges!)
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      if (idx === 0) {
        // Gold Circle Badge
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(60, y + 15, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#1e1b4b"; // Dark text inside
        ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
        ctx.fillText("1", 60, y + 16);
      } else if (idx === 1) {
        // Silver Circle Badge
        ctx.fillStyle = "#cbd5e1";
        ctx.beginPath();
        ctx.arc(60, y + 15, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
        ctx.fillText("2", 60, y + 16);
      } else if (idx === 2) {
        // Bronze Circle Badge
        ctx.fillStyle = "#d97706"; // Bronze/Amber
        ctx.beginPath();
        ctx.arc(60, y + 15, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
        ctx.fillText("3", 60, y + 16);
      } else {
        // Normal Rank
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
        ctx.fillText(`#${idx + 1}`, 60, y + 15);
      }
      
      ctx.textBaseline = "alphabetic"; // Reset to default

      // Name
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
      // Truncate name if it's too long
      let displayName = p.nama;
      if (displayName.length > 18) displayName = displayName.substring(0, 16) + "...";
      ctx.fillText(displayName, 105, y + 20);

      // Pangkat/Badge Title
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "500 12px system-ui, -apple-system, sans-serif";
      ctx.fillText(`${pangkat.emoji} ${pangkat.title}`, 235, y + 20);

      // Columns Activity Stats
      ctx.textAlign = "center";
      
      // Adzan Count
      ctx.fillStyle = "#38bdf8"; // Sky blue
      ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
      ctx.fillText(`${stats.adzanCount}x`, 420, y + 20);

      // Sholawat Count
      ctx.fillStyle = "#2dd4bf"; // soft teal
      ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
      ctx.fillText(`${stats.sholawatIqomahCount}x`, 505, y + 20);

      // Attendance Count (Latihan)
      ctx.fillStyle = "#fb923c"; // soft orange
      ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
      ctx.fillText(`${stats.attendanceCount}x`, 590, y + 20);

      // Total Points
      ctx.textAlign = "right";
      ctx.fillStyle = "#fbbf24"; // Amber gold
      ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
      ctx.fillText(`${stats.total} Pts`, 710, y + 20);

      y += rowHeight;
    });

    // 4. Draw Footer
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(width - 30, y);
    ctx.stroke();

    ctx.fillStyle = "#6366f1"; // Indigo accent text
    ctx.font = "bold italic 12px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Generasi Muda Cinta Masjid! 🕌✨", width / 2, y + 30);

    ctx.fillStyle = "#475569"; // Slate text
    ctx.font = "500 9px system-ui, -apple-system, sans-serif";
    ctx.fillText("Dibuat otomatis oleh Adzan Challenge App", width / 2, y + 48);

    // 5. Trigger download as PNG
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Klasemen_Adzan_Bocil_${new Date().toLocaleDateString("id-ID").replace(/\//g, "-")}.png`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadAvatarImages = async (list: Participant[]): Promise<Record<string, HTMLImageElement>> => {
    const promises = list.map((p) => {
      if (!p.avatar_url) return Promise.resolve({ id: String(p.id), img: null });
      return new Promise<{ id: string; img: HTMLImageElement | null }>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous"; // prevent canvas taint issues
        img.src = p.avatar_url as string;
        img.onload = () => resolve({ id: String(p.id), img });
        img.onerror = () => resolve({ id: String(p.id), img: null });
      });
    });
    const results = await Promise.all(promises);
    const map: Record<string, HTMLImageElement> = {};
    results.forEach((res) => {
      if (res.img) map[res.id] = res.img;
    });
    return map;
  };

  const downloadParticipantReportImage = async (p: Participant) => {
    const stats = points[String(p.id)] || {
      total: 0,
      adzanCount: 0,
      sholawatIqomahCount: 0,
      attendanceCount: 0,
      quizCount: 0,
    };
    const pangkatInfo = getPangkat(stats.total);
    const rankIndex = leaderboard.findIndex((item) => item.id === p.id) + 1;

    // 1. Preload ALL participant avatar images in parallel
    const avatarImages = await loadAvatarImages(leaderboard);
    const myImg = avatarImages[String(p.id)];

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dimensions: Ultra-HD Portrait Card (900x1480 px) - Razor Sharp on Mobile!
    const width = 900;
    const height = 1480;
    canvas.width = width;
    canvas.height = height;

    const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    // Draw circular cropped image
    const drawCircularImage = (img: HTMLImageElement, cx: number, cy: number, r: number) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
      ctx.restore();
    };

    const drawCircularFallback = (initial: string, cx: number, cy: number, r: number, bgColor: string) => {
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(r * 0.9)}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(initial, cx, cy);
      ctx.textBaseline = "alphabetic"; // reset
    };

    // 2. Background Gradient (Dark Mode Luxury slate/indigo)
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "#0f172a"); // slate-900
    grad.addColorStop(1, "#1e1b4b"); // indigo-950
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // If they have a profile photo, draw it as a gorgeous ambient background watermark
    if (myImg) {
      ctx.save();
      ctx.globalAlpha = 0.15; // Soft ambient cover watermark
      ctx.drawImage(myImg, 0, 0, width, height);
      ctx.restore();
    }

    // Glowing ambient backgrounds
    ctx.fillStyle = "rgba(99, 102, 241, 0.15)";
    ctx.beginPath();
    ctx.arc(width / 2, 150, 300, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(244, 63, 94, 0.06)";
    ctx.beginPath();
    ctx.arc(width / 2, height - 150, 250, 0, Math.PI * 2);
    ctx.fill();

    // Glowing border around card
    ctx.strokeStyle = "rgba(245, 158, 11, 0.3)"; // amber glow
    ctx.lineWidth = 6;
    drawRoundRect(25, 25, width - 50, height - 50, 30);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1.5;
    drawRoundRect(35, 35, width - 70, height - 70, 26);
    ctx.stroke();

    // 3. Title Header
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
    ctx.fillText("📜 KARTU PRESTASI ADZAN BOCIL 🕌", width / 2, 85);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 115);
    ctx.lineTo(width - 60, 115);
    ctx.stroke();

    // 4. Large Profile Avatar Area (Asynchronous image draw!)
    const avatarX = 140;
    const avatarY = 210;
    const avatarR = 54;

    // Draw avatar gold border glow
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR + 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw avatar image or fallback
    if (myImg) {
      drawCircularImage(myImg, avatarX, avatarY, avatarR);
    } else {
      drawCircularFallback(p.nama.charAt(0).toUpperCase(), avatarX, avatarY, avatarR, "#6366f1");
    }

    // Name & Pangkat details
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
    ctx.fillText(p.nama.length > 20 ? p.nama.substring(0, 18) + "..." : p.nama, 220, 195);

    // Pangkat Badge
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
    ctx.fillText(`${pangkatInfo.current.emoji} ${pangkatInfo.current.title}`, 220, 232);

    // Rank Badge
    ctx.fillStyle = "#38bdf8"; // sky blue
    ctx.font = "bold 16px system-ui, -apple-system, sans-serif";
    ctx.fillText(`🏆 Peringkat #${rankIndex} dari ${leaderboard.length} Adzan Bocil`, 220, 262);

    // 5. Total Poin Card (Full-width Center)
    ctx.fillStyle = "rgba(251, 191, 36, 0.08)";
    drawRoundRect(60, 290, 780, 100, 20);
    ctx.fill();
    ctx.strokeStyle = "rgba(251, 191, 36, 0.3)";
    ctx.lineWidth = 1.5;
    drawRoundRect(60, 290, 780, 100, 20);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "bold 15px system-ui, -apple-system, sans-serif";
    ctx.fillText("TOTAL POIN PRESTASI ADZAN BOCIL 🏆", width / 2, 328);

    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 44px system-ui, -apple-system, sans-serif";
    ctx.fillText(`${stats.total} Pts`, width / 2, 372);

    // 6. Target Selanjutnya Progress bar (Full-width Center)
    ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    drawRoundRect(60, 405, 780, 80, 18);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    drawRoundRect(60, 405, 780, 80, 18);
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
    if (pangkatInfo.next) {
      ctx.fillText(`TARGET BERIKUTNYA: ${pangkatInfo.next.title.toUpperCase()}`, 90, 436);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fbbf24";
      ctx.fillText(`${pangkatInfo.next.min - stats.total} POIN LAGI`, 810, 436);

      // Progress Bar Track
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      drawRoundRect(90, 452, 720, 14, 7);
      ctx.fill();

      // Progress Bar Fill
      const ratio = Math.min(100, Math.round(((stats.total - pangkatInfo.current.min) / (pangkatInfo.next.min - pangkatInfo.current.min)) * 100));
      const fillW = Math.max(14, Math.round((ratio / 100) * 720));
      ctx.fillStyle = "#fbbf24";
      drawRoundRect(90, 452, fillW, 14, 7);
      ctx.fill();
    } else {
      ctx.textAlign = "center";
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 16px system-ui, -apple-system, sans-serif";
      ctx.fillText("MASYAA ALLAH! PANGKAT TERTINGGI TELAH DICAPAI! 👑", width / 2, 450);
    }

    // 7. Activity Grid (2x2 Aligned with Leaderboard)
    const drawGridCell = (x: number, y: number, w: number, h: number, title: string, value: string, iconStr: string, themeColor: string, bgColor: string, borderCol: string) => {
      ctx.fillStyle = bgColor;
      drawRoundRect(x, y, w, h, 16);
      ctx.fill();

      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 1.5;
      drawRoundRect(x, y, w, h, 16);
      ctx.stroke();

      // Title
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
      ctx.fillText(`${iconStr} ${title}`, x + 25, y + 35);

      // Value
      ctx.fillStyle = themeColor;
      ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
      ctx.fillText(value, x + 25, y + 72);
    };

    // Row 1
    // Adzan (Blue theme)
    drawGridCell(60, 500, 370, 95, "KUMANDANG ADZAN", `${stats.adzanCount} Kali`, "📢", "#38bdf8", "rgba(56, 189, 248, 0.05)", "rgba(56, 189, 248, 0.2)");
    // Sholawat (Teal theme)
    drawGridCell(470, 500, 370, 95, "SHOLAWAT + IQOMAH", `${stats.sholawatIqomahCount} Kali`, "📿", "#2dd4bf", "rgba(45, 212, 191, 0.05)", "rgba(45, 212, 191, 0.2)");

    // Row 2
    // Kehadiran Latihan (Orange theme)
    drawGridCell(60, 610, 370, 95, "KEHADIRAN LATIHAN", `${stats.attendanceCount} Kali`, "🏃", "#fb923c", "rgba(251, 146, 60, 0.05)", "rgba(251, 146, 60, 0.2)");
    // Quiz (Purple theme)
    drawGridCell(470, 610, 370, 95, "JAWAB KUIS MASJID", `${stats.quizCount} Kali`, "📝", "#c084fc", "rgba(192, 132, 252, 0.05)", "rgba(192, 132, 252, 0.2)");

    // 8. 2-Column Mini Leaderboard (Pesaing & Klasemen Santri Lengkap!)
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
    ctx.fillText("🏆 KLASEMEN PRESTASI KESELURUHAN ADZAN BOCIL 👥", width / 2, 750);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, 770);
    ctx.lineTo(width - 100, 770);
    ctx.stroke();

    const startY = 800;
    const rowHeight = 54;
    const maxRows = 10; // Supports up to 20 children!

    // Slice first 10 for Left column, next 10 for Right column
    const leftColList = leaderboard.slice(0, maxRows);
    const rightColList = leaderboard.slice(maxRows, maxRows * 2);

    const drawLeaderboardColumn = (list: Participant[], startX: number, colMaxRankOffset: number) => {
      list.forEach((kid, i) => {
        const kidRank = colMaxRankOffset + i + 1;
        const kidStats = points[String(kid.id)] || { total: 0 };
        const isSelf = kid.id === p.id;
        const rowY = startY + i * rowHeight;
        const rowW = 370;
        const rowH = 48;

        // Draw capsule background
        if (isSelf) {
          ctx.fillStyle = "rgba(251, 191, 36, 0.18)";
          drawRoundRect(startX, rowY, rowW, rowH, 12);
          ctx.fill();
          ctx.strokeStyle = "rgba(251, 191, 36, 0.5)";
          ctx.lineWidth = 2;
          drawRoundRect(startX, rowY, rowW, rowH, 12);
          ctx.stroke();
        } else {
          ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
          drawRoundRect(startX, rowY, rowW, rowH, 12);
          ctx.fill();
          ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
          ctx.lineWidth = 1;
          drawRoundRect(startX, rowY, rowW, rowH, 12);
          ctx.stroke();
        }

        // Draw Rank badge
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (kidRank === 1) {
          ctx.fillStyle = "#fbbf24";
          ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
          ctx.fillText("🥇", startX + 25, rowY + 24);
        } else if (kidRank === 2) {
          ctx.fillStyle = "#cbd5e1";
          ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
          ctx.fillText("🥈", startX + 25, rowY + 24);
        } else if (kidRank === 3) {
          ctx.fillStyle = "#d97706";
          ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
          ctx.fillText("🥉", startX + 25, rowY + 24);
        } else {
          ctx.fillStyle = isSelf ? "#fbbf24" : "rgba(255, 255, 255, 0.5)";
          ctx.font = "bold 15px system-ui, -apple-system, sans-serif";
          ctx.fillText(`#${kidRank}`, startX + 25, rowY + 24);
        }

        // Draw Small Avatar Photo
        const avatarCX = startX + 65;
        const avatarCY = rowY + 24;
        const avatarSizeR = 16;

        const kidImg = avatarImages[String(kid.id)];
        if (kidImg) {
          drawCircularImage(kidImg, avatarCX, avatarCY, avatarSizeR);
        } else {
          const initials = kid.nama.charAt(0).toUpperCase();
          drawCircularFallback(initials, avatarCX, avatarCY, avatarSizeR, isSelf ? "#fbbf24" : "#6366f1");
        }

        // Draw Name text
        ctx.textAlign = "left";
        ctx.fillStyle = isSelf ? "#fbbf24" : "#ffffff";
        ctx.font = "bold 17px system-ui, -apple-system, sans-serif";
        let displayKidName = kid.nama.split(" ")[0];
        if (displayKidName.length > 10) displayKidName = displayKidName.substring(0, 8) + "..";
        ctx.fillText(displayKidName, startX + 95, rowY + 24);

        // Draw Poin text
        ctx.textAlign = "right";
        ctx.fillStyle = isSelf ? "#fbbf24" : "#cbd5e1";
        ctx.font = "bold 17px system-ui, -apple-system, sans-serif";
        ctx.fillText(`${kidStats.total} Pts`, startX + 350, rowY + 24);
      });
    };

    // Draw Left Column (Ranks 1 to 10)
    drawLeaderboardColumn(leftColList, 60, 0);

    // Draw Right Column (Ranks 11 to 20)
    drawLeaderboardColumn(rightColList, 470, maxRows);

    ctx.textBaseline = "alphabetic"; // reset

    // 9. Footer Slogan and Date
    ctx.textAlign = "center";
    ctx.fillStyle = "#2dd4bf"; // soft teal
    ctx.font = "bold italic 16px system-ui, -apple-system, sans-serif";
    ctx.fillText("Barakallah! Terus Semangat Memakmurkan Masjid! 🕌✨", width / 2, 1380);

    ctx.fillStyle = "#64748b"; // slate text
    ctx.font = "500 12px system-ui, -apple-system, sans-serif";
    ctx.fillText(`Dicetak otomatis oleh Adzan Challenge App pada ${new Date().toLocaleDateString("id-ID")}`, width / 2, 1415);

    // 10. Trigger PNG download
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Kartu_Prestasi_HD_${p.nama.replace(/\s+/g, "_")}.png`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              <div className="bg-white/15 border border-white/20 rounded-3xl p-6 text-white min-w-[320px]">
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
              <div className="bg-white/15 border border-white/20 rounded-3xl p-6 text-white text-center">
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
            <div className="bocil-card-header flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex items-center gap-2.5">
                <h2 className="bocil-card-title text-base sm:text-lg">🏅 Papan Peringkat</h2>
                <span className="bocil-badge-gold text-xs px-2.5 py-1">Top {leaderboard.length}</span>
              </div>
              <button
                onClick={downloadLeaderboardImage}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-primary-100"
              >
                <span>📥</span>
                <span>Unduh Gambar Klasemen</span>
              </button>
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
                        loading="lazy"
                        decoding="async"
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
                          loading="lazy"
                          decoding="async"
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
                              loading="lazy"
                              decoding="async"
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
              <h2 className="bocil-card-title">🎤 Aktivitas Terbaru</h2>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {recentActivity.map((item) => {
                const isLatihan = item._type === 'latihan';
                const isAdzan = !isLatihan && (item as any).adzanPoints === 10;
                const isSholawat = !isLatihan && (item as any).adzanPoints === 8;

                const createdDate = item.createdAt ? new Date(item.createdAt) : null;
                const timeLabel = createdDate
                  ? createdDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                  : null;
                const dateLabel = createdDate
                  ? createdDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                  : item.date;

                const pts = isLatihan ? (item as any).points : (item as any).total;
                const emoji = isLatihan ? '⭐' : isAdzan ? '📢' : '📿';
                const typeLabel = isLatihan ? 'Latihan' : isAdzan ? 'Adzan' : 'Sholawat+Iqomah';
                const avatarBg = isLatihan
                  ? 'bg-blue-500'
                  : (item as any).attitude === 'Bagus'
                    ? 'bg-emerald-500'
                    : (item as any).attitude === 'Cukup Bagus'
                      ? 'bg-yellow-500'
                      : 'bg-red-500';

                const participant = participants.find(p => String(p.id) === String(item.participantId));
                const avatarUrl = participant?.avatar_url;
                const hasAvatar = !!avatarUrl;

                const avatarBorder = isLatihan
                  ? 'border-blue-500'
                  : (item as any).attitude === 'Bagus'
                    ? 'border-emerald-500'
                    : (item as any).attitude === 'Cukup Bagus'
                      ? 'border-yellow-500'
                      : 'border-red-500';

                return (
                  <div
                    key={`${item._type}-${item.id}`}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0 overflow-hidden",
                      hasAvatar ? cn("border-2", avatarBorder) : avatarBg
                    )}>
                      {hasAvatar ? (
                        <img
                          src={avatarUrl}
                          alt={item.participantName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        item.participantName.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">
                        {item.participantName}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                        <span>{emoji}</span>
                        <span className="uppercase">{item.prayerTime}</span>
                        <span className="text-gray-200">•</span>
                        <span className="text-[9px]">{typeLabel}</span>
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-2 py-1 rounded-lg block">+{pts}</span>
                      <span className="text-[9px] text-gray-300 font-medium block mt-0.5">
                        {timeLabel ?? dateLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
              {recentActivity.length === 0 && (
                <div className="text-center py-12">
                  <span className="text-4xl block mb-2">🎤</span>
                  <p className="text-gray-400 text-xs italic">
                    Belum ada aktivitas terbaru.
                    <br />
                    Ayo catat adzan atau latihan! ✨
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

          {/* Keterangan Warna Avatar Card */}
          <div className="bocil-card bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
              🎨 Panduan Warna Avatar
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold">
                    <th className="pb-2 font-semibold">Item</th>
                    <th className="pb-2 font-semibold">Tampilan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-700">
                  <tr>
                    <td className="py-2.5 font-bold flex items-center gap-1">📢 Adzan</td>
                    <td className="py-2.5">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-500 text-white font-black text-[9px]">Hijau</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-yellow-500 text-white font-black text-[9px]">Kuning</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-red-500 text-white font-black text-[9px]">Merah</span>
                        <span className="text-[10px] text-gray-500 block sm:inline mt-0.5 sm:mt-0 font-medium">(Sesuai Sikap)</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold flex items-center gap-1">📿 Sholawat + Iqomah</td>
                    <td className="py-2.5">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-500 text-white font-black text-[9px]">Hijau</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-yellow-500 text-white font-black text-[9px]">Kuning</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-red-500 text-white font-black text-[9px]">Merah</span>
                        <span className="text-[10px] text-gray-500 block sm:inline mt-0.5 sm:mt-0 font-medium">(Sesuai Sikap)</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold flex items-center gap-1">⭐ Latihan</td>
                    <td className="py-2.5">
                      <span className="px-1.5 py-0.5 rounded-md bg-blue-500 text-white font-black text-[9px]">Biru</span>
                      <span className="text-[10px] text-gray-500 ml-1 font-medium">(Beda dengan adzan)</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Jadwal Adzan Mingguan Section */}
      <div className="bocil-card mb-12 animate-fade-in">
        <div className="bocil-card-header flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b pb-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <h2 className="bocil-card-title flex items-center gap-2">
                <span>📅</span> Jadwal Adzan Mingguan 📢
              </h2>
              <p className="text-xs text-gray-500 mt-1">Jadwal resmi agar tertib dan engga rebutan slot adzan di masjid!</p>
            </div>
            
            {/* Day Filter Dropdown */}
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-2xl border border-gray-200/60 shrink-0">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Cek Hari:</span>
              <select
                value={selectedDayFilter}
                onChange={(e) => setSelectedDayFilter(e.target.value)}
                className="text-xs font-bold bg-transparent text-gray-700 outline-none cursor-pointer focus:text-primary-600 transition-colors font-sans"
              >
                <option value="Semua">🌟 Semua Hari</option>
                <option value="Senin">📅 Senin</option>
                <option value="Selasa">📅 Selasa</option>
                <option value="Rabu">📅 Rabu</option>
                <option value="Kamis">📅 Kamis</option>
                <option value="Jum'at">📅 Jum'at</option>
                <option value="Sabtu">📅 Sabtu</option>
                <option value="Minggu">📅 Minggu</option>
              </select>
            </div>
          </div>
          {myParticipant && (
            <div className={`px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all duration-300 flex items-center gap-2
              ${myAssignedSlots.length > 0 
                ? 'bg-amber-50 border-amber-200 text-amber-800 shadow-sm animate-pulse' 
                : 'bg-indigo-50 border-indigo-100 text-indigo-800'
              }`}
            >
              {myAssignedSlots.length > 0 ? (
                <>
                  <span>✨</span>
                  <span>
                    Kamu dijadwalkan adzan minggu ini: <strong>{myAssignedSlots.map(s => `${s.day} (${s.prayer})`).join(', ')}</strong>! Semangat ya! 🎤
                  </span>
                </>
              ) : (
                <>
                  <span>👋</span>
                  <span>Kamu belum dijadwalkan adzan minggu ini. Hubungi Admin Masjid untuk pembagian slot!</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Schedule Matrix for Kids (Desktop View) */}
        <div className="hidden lg:block overflow-x-auto rounded-2xl border border-gray-100 custom-scrollbar">
          <table className="w-full text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left font-black text-gray-400 text-xs uppercase w-28">Hari</th>
                {["Shubuh", "Zhuhur", "Ashar", "Magrib", "Isya"].map(prayer => (
                  <th key={prayer} className="px-4 py-3 text-center font-black text-gray-400 text-xs uppercase">{prayer}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {["Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu", "Minggu"]
                .filter(day => selectedDayFilter === "Semua" || day === selectedDayFilter)
                .map(day => {
                // Check if this day is today
                const dayIndexMap: Record<string, number> = {
                  "Minggu": 0, "Senin": 1, "Selasa": 2, "Rabu": 3, "Kamis": 4, "Jum'at": 5, "Sabtu": 6
                };
                const todayIndex = new Date().getDay();
                const isToday = dayIndexMap[day] === todayIndex;

                return (
                  <tr key={day} className={`transition-colors ${isToday ? 'bg-amber-50/20' : 'hover:bg-gray-50/30'}`}>
                    {/* Day Column */}
                    <td className={`px-4 py-4 font-extrabold text-sm w-28 relative ${isToday ? 'text-amber-700 bg-amber-50/30' : 'text-gray-900 bg-gray-50/20'}`}>
                      {isToday && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-r-md" />
                      )}
                      <div className="flex items-center gap-1.5">
                        <span>{day}</span>
                        {isToday && (
                          <span className="text-[9px] font-black bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-md animate-bounce uppercase whitespace-nowrap">
                            Hari Ini 📍
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Prayer Columns */}
                    {["Shubuh", "Zhuhur", "Ashar", "Magrib", "Isya"].map(prayer => {
                      const name = schedule[day]?.[prayer] || 'Kosong';
                      const isLocked = day === "Jum'at" && prayer === "Zhuhur";
                      const isMySlot = myName && name.toLowerCase() === myName.toLowerCase();
                      
                      // Find registered participant details for avatar url
                      const registeredKid = participants.find(p => p.nama.toLowerCase() === name.toLowerCase());

                      if (isLocked) {
                        return (
                          <td key={prayer} className="px-2 py-3 text-center">
                            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100/50 text-gray-400 text-xs font-semibold w-full justify-center">
                              <span>🔒</span> Jumatan
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td key={prayer} className="px-2 py-3 text-center">
                          <div className={`px-3 py-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all duration-300
                            ${isMySlot 
                              ? 'bg-gradient-to-r from-amber-400 to-yellow-400 border-yellow-400 text-yellow-950 shadow-md shadow-yellow-200/50 scale-105 z-10' 
                              : name === 'Kosong'
                                ? 'bg-red-50/50 border-red-100 text-red-500'
                                : 'bg-white border-gray-100 text-gray-800'
                            }`}
                          >
                            {/* Small Avatar inside slot */}
                            {!isLocked && name !== 'Kosong' && (
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 overflow-hidden
                                ${isMySlot ? 'bg-yellow-950 text-yellow-400' : 'bg-primary-100 text-primary-700'}`}
                              >
                                {registeredKid?.avatar_url ? (
                                  <img src={registeredKid.avatar_url} alt={name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                                ) : (
                                  name.charAt(0)
                                )}
                              </div>
                            )}
                            <span className="truncate max-w-[90px]">{name}</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Vertical Day Cards (Hidden on Desktop) */}
        <div className="block lg:hidden space-y-6">
          {["Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu", "Minggu"]
            .filter(day => selectedDayFilter === "Semua" || day === selectedDayFilter)
            .map(day => {
            const dayIndexMap: Record<string, number> = {
              "Minggu": 0, "Senin": 1, "Selasa": 2, "Rabu": 3, "Kamis": 4, "Jum'at": 5, "Sabtu": 6
            };
            const todayIndex = new Date().getDay();
            const isToday = dayIndexMap[day] === todayIndex;

            return (
              <div 
                key={day} 
                className={`p-5 rounded-3xl border-2 transition-all duration-300
                  ${isToday 
                    ? 'bg-amber-50/20 border-amber-400 shadow-md ring-2 ring-amber-200' 
                    : 'bg-white border-gray-100'
                  }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                  <span className={`font-black text-sm ${isToday ? 'text-amber-800' : 'text-gray-900'}`}>
                    {day}
                  </span>
                  {isToday && (
                    <span className="text-[9px] font-black bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full animate-pulse uppercase tracking-wider">
                      Hari Ini 📍
                    </span>
                  )}
                </div>

                {/* Prayers List */}
                <div className="space-y-2">
                  {["Shubuh", "Zhuhur", "Ashar", "Magrib", "Isya"].map(prayer => {
                    const name = schedule[day]?.[prayer] || 'Kosong';
                    const isLocked = day === "Jum'at" && prayer === "Zhuhur";
                    const isMySlot = myName && name.toLowerCase() === myName.toLowerCase();
                    const registeredKid = participants.find(p => p.nama.toLowerCase() === name.toLowerCase());

                    const prayerEmojis: Record<string, string> = {
                      "Shubuh": "🌅", "Zhuhur": "☀️", "Ashar": "🌤️", "Magrib": "🌇", "Isya": "🌙"
                    };

                    if (isLocked) {
                      return (
                        <div 
                          key={prayer} 
                          className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/70 border border-gray-100 text-gray-400 text-xs font-semibold"
                        >
                          <span className="font-bold flex items-center gap-1.5">
                            <span>{prayerEmojis[prayer]}</span>
                            <span>{prayer}</span>
                          </span>
                          <span className="font-semibold flex items-center gap-1">🔒 Jumatan</span>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={prayer} 
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-300 text-xs
                          ${isMySlot 
                            ? 'bg-gradient-to-r from-amber-400 to-yellow-400 border-yellow-400 text-yellow-950 shadow-md font-black scale-102' 
                            : name === 'Kosong'
                              ? 'bg-red-50/40 border-red-100 text-red-500 font-bold'
                              : 'bg-gray-50/50 border-gray-100 text-gray-700 font-bold'
                          }`}
                      >
                        {/* Prayer Name */}
                        <span className="font-extrabold flex items-center gap-2">
                          <span>{prayerEmojis[prayer]}</span>
                          <span>{prayer}</span>
                        </span>

                        {/* Muadzin Name */}
                        <div className="flex items-center gap-2">
                          {name !== 'Kosong' && (
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 overflow-hidden
                              ${isMySlot ? 'bg-yellow-950 text-yellow-400' : 'bg-primary-100 text-primary-700'}`}
                            >
                              {registeredKid?.avatar_url ? (
                                <img src={registeredKid.avatar_url} alt={name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                              ) : (
                                name.charAt(0)
                              )}
                            </div>
                          )}
                          <span className={isMySlot ? 'text-yellow-950 font-black' : 'font-bold'}>{name}</span>
                          {isMySlot && (
                            <span className="text-[8px] bg-yellow-950 text-yellow-400 px-1 py-0.5 rounded-full font-black animate-pulse">AKU!</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                label: "Sholawat + Iqomah",
                points: "+8 Poin",
                extra: "Tarhim + Iqomah",
                emoji: "📿",
                color: "text-blue-600",
                bg: "bg-blue-50",
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
                  "flex flex-col items-center text-center p-3 rounded-2xl border border-transparent shadow-sm",
                  item.bg,
                )}
              >
                <span className="text-3xl mb-2">{item.emoji}</span>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight mb-1">
                  {item.label}
                </p>
                <p className={cn("text-lg font-black", item.color)}>
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
          <div className="space-y-3.5">
            {/* Header info - Side-by-Side Premium Layout! */}
            <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-100/50">
              <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-2xl overflow-hidden shadow-inner border-2 border-white flex-shrink-0">
                {viewParticipant.avatar_url ? (
                  <img
                    src={viewParticipant.avatar_url}
                    alt={viewParticipant.nama}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  viewParticipant.nama.charAt(0)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black text-gray-900 font-heading truncate leading-tight">
                  {viewParticipant.nama}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                    <span>
                      {
                        getPangkat(points[viewParticipant.id]?.total ?? 0).current
                          .emoji
                      }
                    </span>
                    <span>
                      {
                        getPangkat(points[viewParticipant.id]?.total ?? 0).current
                          .title
                      }
                    </span>
                  </div>
                  {activeModalRank && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-100 border border-primary-200 text-primary-700 text-[10px] font-bold uppercase tracking-wider">
                      <span>🏆</span>
                      <span>Peringkat #{activeModalRank}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Grid - Super Compact & Premium! */}
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: "Total Poin",
                  value: `${points[viewParticipant.id]?.total ?? 0} Pts`,
                  icon: Award,
                  color: "text-amber-600",
                  bg: "bg-amber-50/70 border-amber-100/50",
                  alignCenter: true,
                  fullWidth: true,
                },
                {
                  label: "Adzan",
                  value: `${points[viewParticipant.id]?.adzanCount ?? 0}x`,
                  icon: Mic,
                  color: "text-primary-600",
                  bg: "bg-primary-50/70 border-primary-100/50",
                },
                {
                  label: "Sholawat + Iqomah",
                  value: `${points[viewParticipant.id]?.sholawatIqomahCount ?? 0}x`,
                  icon: Star,
                  color: "text-blue-600",
                  bg: "bg-blue-50/70 border-blue-100/50",
                },
                {
                  label: "Latihan",
                  value: `${points[viewParticipant.id]?.attendanceCount ?? 0}x`,
                  icon: CheckCircle2,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50/70 border-emerald-100/50",
                },
                {
                  label: "Jawab Quiz",
                  value: `${points[viewParticipant.id]?.quizCount ?? 0}x`,
                  icon: BookOpen,
                  color: "text-purple-600",
                  bg: "bg-purple-50/70 border-purple-100/50",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "p-2.5 rounded-xl border flex flex-col justify-center",
                    item.bg,
                    item.fullWidth && "col-span-2",
                    item.alignCenter ? "items-center text-center" : "items-start text-left",
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <item.icon className={cn("w-3.5 h-3.5", item.color)} />
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">
                      {item.label}
                    </span>
                  </div>
                  <p className="text-base font-black text-gray-900 leading-none mt-0.5">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>



            {/* Next Rank Progress in Modal - Super Compact! */}
            {getPangkat(points[viewParticipant.id]?.total ?? 0).next && (
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <div className="flex justify-between text-[9px] font-black uppercase mb-1.5">
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
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min(100, Math.round((((points[viewParticipant.id]?.total ?? 0) - getPangkat(points[viewParticipant.id]?.total ?? 0).current.min) / (getPangkat(points[viewParticipant.id]?.total ?? 0).next!.min - getPangkat(points[viewParticipant.id]?.total ?? 0).current.min)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Actions Footer */}
            <div className="flex gap-2">
              <Button
                onClick={() => downloadParticipantReportImage(viewParticipant)}
                className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-xl transition-all active:scale-95 text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-sm shadow-primary-200"
              >
                <span>📥</span>
                <span>UNDUH KARTU PRESTASI</span>
              </Button>
              <Button
                onClick={() => setViewParticipant(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-xl transition-all active:scale-95 text-xs tracking-wider"
              >
                TUTUP
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
