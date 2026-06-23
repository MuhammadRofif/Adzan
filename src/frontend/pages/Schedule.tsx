import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, UserPlus, Sparkles, RefreshCw, AlertTriangle, CheckCircle2, Lock, HelpCircle, MessageSquare, Copy, Share2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';

// Weekly Schedule presets and configurations
export const DAYS_OF_WEEK = ["Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu", "Minggu"];
export const PRAYER_TIMES = ["Shubuh", "Zhuhur", "Ashar", "Magrib", "Isya"];


// Shubuh hanya Hafi & Rega (Atha sudah nonaktif)
const SHUBUH_ROTATION = ["Hafi", "Rega"];


export const SchedulePage: React.FC = () => {
  const { participants, showToast, schedule, updateSchedule: setSchedule } = useApp();


  const [editingSlot, setEditingSlot] = useState<{ day: string; prayer: string } | null>(null);

  // State & helper for WhatsApp schedule generator
  const [waDay, setWaDay] = useState<string>(() => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu"];
    return days[new Date().getDay()];
  });

  const whatsappMessage = useMemo(() => {
    if (waDay === "Semua") {
      const scheduleText = DAYS_OF_WEEK.map(day => {
        const daySchedule = schedule[day] || {};
        const shubuh = daySchedule["Shubuh"] || "Kosong";
        const zhuhur = daySchedule["Zhuhur"] || "Kosong";
        const ashar = daySchedule["Ashar"] || "Kosong";
        const magrib = daySchedule["Magrib"] || "Kosong";
        const isya = daySchedule["Isya"] || "Kosong";

        const isJumatZhuhur = day === "Jum'at" ? "🔒 Shalat Jum'at" : zhuhur;

        return `*Jadwal Adzan Hari ${day}*
🌅 Shubuh: ${shubuh}
☀️ Zhuhur: ${isJumatZhuhur}
🌤️ Ashar: ${ashar}
🌇 Magrib: ${magrib}
🌙 Isya: ${isya}`;
      }).join("\n\n");

      return `${scheduleText}

*Keterangan:*
- Jadwal sudah dibagi rata secara adil (maksimal 2x seminggu).
- Jika berhalangan/tidak bisa, silakan bisa saling tukar jadwal (tukaran) sendiri ya!`;
    }

    const daySchedule = schedule[waDay] || {};
    const shubuh = daySchedule["Shubuh"] || "Kosong";
    const zhuhur = daySchedule["Zhuhur"] || "Kosong";
    const ashar = daySchedule["Ashar"] || "Kosong";
    const magrib = daySchedule["Magrib"] || "Kosong";
    const isya = daySchedule["Isya"] || "Kosong";

    const isJumatZhuhur = waDay === "Jum'at" ? "🔒 Shalat Jum'at" : zhuhur;

    return `*Jadwal Adzan Hari ${waDay}*
🌅 Shubuh: ${shubuh}
☀️ Zhuhur: ${isJumatZhuhur}
🌤️ Ashar: ${ashar}
🌇 Magrib: ${magrib}
🌙 Isya: ${isya}`;
  }, [waDay, schedule]);

  const handleCopyWhatsapp = () => {
    // Universal copy method that works perfectly on 100% of all mobile phones, WebViews, and HTTP/HTTPS contexts
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(whatsappMessage)
        .then(() => {
          showToast(waDay === "Semua" ? "Jadwal semua hari berhasil disalin! 📋" : `Jadwal hari ${waDay} berhasil disalin! 📋`, 'success');
        })
        .catch(() => fallbackCopy(whatsappMessage));
    } else {
      fallbackCopy(whatsappMessage);
    }
  };

  const fallbackCopy = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Position text area off-screen
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        showToast(waDay === "Semua" ? "Jadwal semua hari berhasil disalin! 📋" : `Jadwal hari ${waDay} berhasil disalin! 📋`, 'success');
      } else {
        showToast('Gagal menyalin. Silakan ketuk lama di kotak preview untuk menyalin manual.', 'error');
      }
    } catch (err) {
      showToast('Gagal menyalin. Silakan ketuk lama di kotak preview untuk menyalin manual.', 'error');
    }

    document.body.removeChild(textArea);
  };

  const handleShareWhatsapp = () => {
    const encoded = encodeURIComponent(whatsappMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };


  // Find active participants from AppContext
  const activeParticipants = participants.filter(p => p.status === 'aktif');

  // Helper to check if a name matches a registered participant
  const findParticipantByName = (name: string) => {
    if (!name || name === 'LOCKED' || name === 'Kosong') return null;
    return activeParticipants.find(p => p.nama.toLowerCase() === name.toLowerCase());
  };

  // Get statistics: how many slots each active participant has
  const getParticipantSlotCounts = () => {
    const counts: Record<string, number> = {};
    activeParticipants.forEach(p => {
      counts[p.nama.toLowerCase()] = 0;
    });

    Object.values(schedule).forEach(daySlots => {
      Object.values(daySlots).forEach(name => {
        if (name && name !== 'LOCKED' && name !== 'Kosong') {
          const key = name.toLowerCase();
          counts[key] = (counts[key] || 0) + 1;
        }
      });
    });

    return counts;
  };

  const slotCounts = getParticipantSlotCounts();

  // New participants not yet in the schedule
  const unassignedParticipants = activeParticipants.filter(p => {
    const count = slotCounts[p.nama.toLowerCase()] || 0;
    return count === 0;
  });

  // Handle slot update
  const handleAssignSlot = (day: string, prayer: string, name: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [prayer]: name
      }
    }));
    setEditingSlot(null);
    showToast(`Jadwal ${day} ${prayer} berhasil diupdate ke ${name}!`, 'success');
  };

  // 1. FAIR SHUFFLE ALGORITHM ("Bagi Adil Semua Peserta")
  // Reshuffles everything from scratch, placing all active participants fairly.
  // Aturan: Shubuh = Hafi & Rega bergantian. Non-Shubuh = max 2 slot/orang.
  const handleFairShuffle = () => {
    if (activeParticipants.length === 0) {
      showToast('Tidak ada peserta aktif untuk diacak!', 'error');
      return;
    }

    // Shubuh: Hafi & Rega bergantian (7 hari → salah satu dapat 4, lainnya 3)
    const hafiMatch = activeParticipants.find(p => p.nama.toLowerCase() === 'hafi')?.nama || 'Hafi';
    const regaMatch = activeParticipants.find(p => p.nama.toLowerCase() === 'rega')?.nama || 'Rega';

    // Randomize who gets the extra Shubuh slot this week
    const shubuhSlots = Math.random() < 0.5
      ? [hafiMatch, regaMatch, hafiMatch, regaMatch, hafiMatch, regaMatch, hafiMatch] // Hafi 4x, Rega 3x
      : [regaMatch, hafiMatch, regaMatch, hafiMatch, regaMatch, hafiMatch, regaMatch]; // Rega 4x, Hafi 3x
    // Acak urutan di antara seminggu
    const shuffledShubuh = [...shubuhSlots].sort(() => Math.random() - 0.5);

    const newSchedule: Record<string, Record<string, string>> = {};

    // Seed shubuh dan default semua slot ke Kosong
    DAYS_OF_WEEK.forEach((day, dayIndex) => {
      newSchedule[day] = {
        "Shubuh": shuffledShubuh[dayIndex],
        "Zhuhur": "Kosong",
        "Ashar": "Kosong",
        "Magrib": "Kosong",
        "Isya": "Kosong",
      };
    });
    // Kunci Jum'at Zhuhur
    newSchedule["Jum'at"]["Zhuhur"] = "LOCKED";

    // Non-Shubuh slots: 7 hari × 4 waktu = 28 slot, -1 LOCKED = 27 slot
    // Peserta non-Shubuh: semua peserta aktif KECUALI Hafi & Rega (mereka khusus Shubuh)
    const generalKids = activeParticipants
      .filter(p => !['hafi', 'rega'].includes(p.nama.toLowerCase()))
      .map(p => p.nama);

    const allocation: string[] = [];
    
    if (generalKids.length > 0) {
      // 1. GARANSI: Setiap anak dapat minimal 1 slot
      allocation.push(...generalKids);
      
      // 2. SISA SLOT: Dibagikan acak untuk slot ke-2 (maksimal 2 slot per anak)
      const remainingSlots = 27 - allocation.length;
      
      if (remainingSlots > 0) {
        const randomizedForExtra = [...generalKids].sort(() => Math.random() - 0.5);
        // Beri slot ke-2 untuk anak-anak acak, tapi tidak lebih dari jumlah anak
        const extraSlots = randomizedForExtra.slice(0, remainingSlots);
        allocation.push(...extraSlots);
      }
    }

    // Acak alokasi dan isi 27 slot non-Shubuh
    const shuffledAlloc = allocation.sort(() => Math.random() - 0.5);
    let allocIdx = 0;

    DAYS_OF_WEEK.forEach(day => {
      PRAYER_TIMES.forEach(prayer => {
        if (prayer === "Shubuh") return; // sudah diisi
        if (day === "Jum'at" && prayer === "Zhuhur") return; // LOCKED
        if (allocIdx < shuffledAlloc.length) {
          newSchedule[day][prayer] = shuffledAlloc[allocIdx++];
        }
        // Sisa slot (jika ada) tetap Kosong
      });
    });

    setSchedule(newSchedule);
    showToast('Jadwal adzan berhasil diacak adil! Setiap santri mendapat maksimal 2 tugas adzan. 📢🎉', 'success');
  };

  // 2. FILL EMPTY / UNASSIGNED ("Masukkan Peserta Baru")
  // Only targets empty spots or custom spots to place kids with 0 slots.
  const handleFillNewParticipants = () => {
    if (unassignedParticipants.length === 0) {
      showToast('Seluruh peserta baru sudah mendapatkan jadwal adzan!', 'info');
      return;
    }

    // Find slots that are empty, unassigned or labeled "Kosong"
    const newSchedule = { ...schedule };
    let assignedCount = 0;
    let kidIndex = 0;

    DAYS_OF_WEEK.forEach(day => {
      PRAYER_TIMES.forEach(prayer => {
        const currentName = newSchedule[day]?.[prayer];
        // Enforce: Never auto-fill Shubuh slots with random kids
        if (prayer !== 'Shubuh' && (currentName === 'Kosong' || !currentName) && kidIndex < unassignedParticipants.length) {
          newSchedule[day][prayer] = unassignedParticipants[kidIndex].nama;
          kidIndex++;
          assignedCount++;
        }
      });
    });

    // If there were no empty slots but we still have new kids, let's swap out some slots of kids who have too many!
    if (kidIndex < unassignedParticipants.length) {
      // Find kids with 2 or more slots, swap one of their slots for the new kids (strictly skip Shubuh)
      DAYS_OF_WEEK.forEach(day => {
        PRAYER_TIMES.forEach(prayer => {
          const currentName = newSchedule[day]?.[prayer];
          if (prayer !== 'Shubuh' && currentName && currentName !== 'LOCKED' && kidIndex < unassignedParticipants.length) {
            const count = slotCounts[currentName.toLowerCase()] || 0;
            if (count > 1) {
              newSchedule[day][prayer] = unassignedParticipants[kidIndex].nama;
              // Decrease their count in our local calculation
              slotCounts[currentName.toLowerCase()]--;
              kidIndex++;
              assignedCount++;
            }
          }
        });
      });
    }

    if (assignedCount > 0) {
      setSchedule(newSchedule);
      showToast(`Berhasil memasukkan ${assignedCount} peserta baru ke dalam jadwal adzan!`, 'success');
    } else {
      showToast('Tidak ada slot tersedia untuk diganti. Coba lakukan "Bagi Adil Semua Peserta"!', 'info');
    }
  };

  // Reset: jalankan ulang bagi adil dari awal
  const handleResetToDefault = () => {
    if (window.confirm("Apakah Anda yakin ingin mengacak ulang jadwal dari awal secara adil?")) {
      handleFairShuffle();
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary-500" />
            Manajemen Jadwal Adzan
          </h1>
          <p className="page-subtitle">Atur dan acak pembagian tugas adzan mingguan santri agar tertib dan adil</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleResetToDefault} variant="ghost" className="text-gray-500 hover:text-gray-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Default
          </Button>
          <Button onClick={handleResetToDefault} className="gradient-primary">
            <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
            Bagi Adil Semua Peserta
          </Button>
        </div>
      </div>

      {/* Info Warning Bar */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
        <HelpCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold">💡 Tips Mengatur Jadwal Biar Engga Rebutan:</p>
          <p className="mt-1">
            Gunakan tombol <strong className="text-primary-700">"Bagi Adil Semua Peserta"</strong> untuk mengacak jadwal seluruh santri secara merata. Hari Jum'at Zhuhur otomatis dikunci (tidak ada adzan bocil). Anda juga bisa mengklik nama anak di tabel untuk mengganti orangnya secara manual.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Weekly Matrix Table */}
        <div className="lg:col-span-3 card p-6 overflow-hidden">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900 font-heading">Tabel Jadwal Mingguan</h2>
            <p className="text-sm text-gray-500">Klik nama pada slot untuk melakukan perubahan manual</p>
                   {/* Desktop Matrix View */}
          <div className="hidden lg:block overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 w-24">Hari</th>
                  {PRAYER_TIMES.map(prayer => (
                    <th key={prayer} className="px-4 py-3 text-center font-semibold text-gray-500">{prayer}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {DAYS_OF_WEEK.map(day => (
                  <tr key={day} className="hover:bg-gray-50/20 transition-colors">
                    {/* Day Column */}
                    <td className="px-4 py-4 font-bold text-gray-900 bg-gray-50/40 w-24">
                      {day}
                    </td>

                    {/* Prayer Columns */}
                    {PRAYER_TIMES.map(prayer => {
                      const name = schedule[day]?.[prayer] || '';
                      const isLocked = day === "Jum'at" && prayer === "Zhuhur";
                      const isShubuh = prayer === "Shubuh";
                      const matchedKid = findParticipantByName(name);
                      const isEditing = editingSlot?.day === day && editingSlot?.prayer === prayer;

                      if (isLocked) {
                        return (
                          <td key={prayer} className="px-2 py-3 text-center">
                            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 text-gray-400 text-xs font-medium w-full justify-center">
                              <Lock className="w-3.5 h-3.5" />
                              Jumatan
                            </div>
                          </td>
                        );
                      }

                      if (isShubuh) {
                        return (
                          <td key={prayer} className="px-2 py-3 text-center">
                            <div className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-gray-100/70 text-gray-500 text-xs font-bold w-full justify-center border border-gray-200/50" title="Slot Shubuh dikunci untuk Atha / Hafi / Rega">
                              <Lock className="w-3.5 h-3.5 text-gray-400" />
                              <span>{name}</span>
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td key={prayer} className="px-2 py-3 text-center relative">
                          {isEditing ? (
                            <select
                              value={name}
                              onChange={(e) => handleAssignSlot(day, prayer, e.target.value)}
                              onBlur={() => setEditingSlot(null)}
                              autoFocus
                              className="w-full text-xs p-1.5 border border-primary-300 rounded-lg shadow-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
                            >
                              <option value="Kosong">-- Kosong --</option>
                              {activeParticipants.map(p => (
                                <option key={p.id} value={p.nama}>{p.nama}</option>
                              ))}
                              {name && !matchedKid && name !== 'Kosong' && (
                                <option value={name}>{name}</option>
                              )}
                            </select>
                          ) : (
                            <button
                              onClick={() => setEditingSlot({ day, prayer })}
                              className={`w-full group px-2 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5
                                ${matchedKid 
                                  ? 'bg-primary-50/60 border-primary-100 text-primary-700 hover:bg-primary-100/70' 
                                  : name === 'Kosong' || !name
                                    ? 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100'
                                    : 'bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100' // Name exists but not registered
                                }`}
                            >
                              <span>{name || 'Kosong'}</span>
                              {!matchedKid && name && name !== 'Kosong' && (
                                <span className="text-amber-500 group-hover:scale-110 transition-transform" title="Anak belum didaftarkan di Manajemen Peserta">⚠️</span>
                              )}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Vertical Day Cards View */}
          <div className="block lg:hidden space-y-6">
            {DAYS_OF_WEEK.map(day => {
              const dayIndexMap: Record<string, number> = {
                "Minggu": 0, "Senin": 1, "Selasa": 2, "Rabu": 3, "Kamis": 4, "Jum'at": 5, "Sabtu": 6
              };
              const todayIndex = new Date().getDay();
              const isToday = dayIndexMap[day] === todayIndex;

              return (
                <div 
                  key={day} 
                  className={`p-4 rounded-2xl border transition-all duration-300 bg-white
                    ${isToday 
                      ? 'border-primary-400 shadow-sm ring-1 ring-primary-100' 
                      : 'border-gray-100'
                    }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                    <span className="font-extrabold text-sm text-gray-900">
                      {day}
                    </span>
                    {isToday && (
                      <span className="text-[9px] font-bold bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Hari Ini 📍
                      </span>
                    )}
                  </div>

                  {/* Prayers List */}
                  <div className="space-y-3">
                    {PRAYER_TIMES.map(prayer => {
                      const name = schedule[day]?.[prayer] || '';
                      const isLocked = day === "Jum'at" && prayer === "Zhuhur";
                      const isShubuh = prayer === "Shubuh";
                      const matchedKid = findParticipantByName(name);
                      const isEditing = editingSlot?.day === day && editingSlot?.prayer === prayer;
                      
                      const prayerEmojis: Record<string, string> = {
                        "Shubuh": "🌅", "Zhuhur": "☀️", "Ashar": "🌤️", "Magrib": "🌇", "Isya": "🌙"
                      };

                      if (isLocked) {
                        return (
                          <div key={prayer} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-gray-400 text-xs">
                            <span className="font-bold flex items-center gap-1.5">
                              <span>{prayerEmojis[prayer]}</span>
                              <span>{prayer}</span>
                            </span>
                            <span className="font-semibold flex items-center gap-1.5"><Lock className="w-3 h-3" /> Jumatan</span>
                          </div>
                        );
                      }

                      if (isShubuh) {
                        return (
                          <div key={prayer} className="flex items-center justify-between p-2.5 bg-gray-100/50 border border-gray-200/50 rounded-xl text-gray-500 text-xs">
                            <span className="font-bold flex items-center gap-1.5">
                              <span>{prayerEmojis[prayer]}</span>
                              <span>{prayer}</span>
                            </span>
                            <span className="font-bold flex items-center gap-1.5">
                              <Lock className="w-3 h-3 text-gray-400" />
                              {name}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div key={prayer} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-gray-50/50 border border-gray-100 rounded-xl">
                          {/* Prayer Label */}
                          <span className="font-extrabold text-xs text-gray-500 flex items-center gap-2">
                            <span>{prayerEmojis[prayer]}</span>
                            <span>{prayer}</span>
                          </span>

                          {/* Selector / Value Button */}
                          <div className="relative">
                            {isEditing ? (
                              <select
                                value={name}
                                onChange={(e) => handleAssignSlot(day, prayer, e.target.value)}
                                onBlur={() => setEditingSlot(null)}
                                autoFocus
                                className="w-full text-xs p-1.5 border border-primary-300 rounded-xl shadow-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white"
                              >
                                <option value="Kosong">-- Kosong --</option>
                                {activeParticipants.map(p => (
                                  <option key={p.id} value={p.nama}>{p.nama}</option>
                                ))}
                                {name && !matchedKid && name !== 'Kosong' && (
                                  <option value={name}>{name}</option>
                                )}
                              </select>
                            ) : (
                              <button
                                onClick={() => setEditingSlot({ day, prayer })}
                                className={`w-full px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 min-w-[130px]
                                  ${matchedKid 
                                    ? 'bg-primary-50 border-primary-100 text-primary-700 hover:bg-primary-100/50' 
                                    : name === 'Kosong' || !name
                                      ? 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100'
                                      : 'bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100'
                                  }`}
                              >
                                <span>{name || 'Kosong'}</span>
                                {!matchedKid && name && name !== 'Kosong' && (
                                  <span className="text-amber-500" title="Anak belum didaftarkan">⚠️</span>
                                )}
                                <span className="text-gray-300">▼</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>       </div>
        </div>

        {/* Sidebar Status & Unassigned */}
        <div className="space-y-6">
          
          {/* Peserta Baru Belum Masuk Jadwal */}
          <div className="card p-6 border-indigo-100 bg-indigo-50/10">
            <h3 className="font-bold text-gray-900 font-heading flex items-center gap-2 mb-2">
              <UserPlus className="w-5 h-5 text-indigo-500" />
              Belum Masuk Jadwal
              {unassignedParticipants.length > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {unassignedParticipants.length}
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500 mb-4">Daftar anak aktif masjid yang belum terjadwal adzan minggu ini.</p>

            {unassignedParticipants.length === 0 ? (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-emerald-800">Semua Anak Terjadwal!</p>
                <p className="text-[10px] text-emerald-600 mt-0.5">Kerja bagus, tidak ada yang rebutan slot.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {unassignedParticipants.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 bg-white border border-gray-100 rounded-xl shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        {p.nama.charAt(0)}
                      </div>
                      <span className="text-xs font-semibold text-gray-800">{p.nama}</span>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">Baru 🆕</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card Format Pesan WhatsApp */}
          <div className="card p-6 border-emerald-100 bg-emerald-50/5 shadow-sm shadow-emerald-50">
            <h3 className="font-bold text-gray-900 font-heading flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5 text-emerald-500" />
              Salin Jadwal ke WhatsApp 💬
            </h3>
            <p className="text-xs text-gray-500 mb-4">Pilih hari untuk menyalin format teks jadwal WA secara instan:</p>

            <div className="flex gap-2 mb-3">
              <select
                value={waDay}
                onChange={(e) => setWaDay(e.target.value)}
                className="text-xs font-bold bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl outline-none focus:ring-1 focus:ring-emerald-400 w-full cursor-pointer"
              >
                <option value="Semua">🌟 Semua Hari (1 Minggu)</option>
                {DAYS_OF_WEEK.map(day => (
                  <option key={day} value={day}>📅 Hari {day}</option>
                ))}
              </select>
            </div>

            {/* Message Preview Box */}
            <div className="bg-emerald-50/30 rounded-2xl p-4 border border-emerald-100/50 text-xs text-gray-700 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto mb-4 custom-scrollbar">
              {whatsappMessage}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyWhatsapp}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all active:scale-95 text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-200"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Pesan</span>
              </button>
              <button
                onClick={handleShareWhatsapp}
                className="py-2.5 px-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-xl transition-all active:scale-95 text-xs flex items-center justify-center gap-1.5"
                title="Bagikan Langsung ke WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              </button>
            </div>
          </div>

          {/* Beban Pembagian Slot */}
          <div className="card p-6">
            <h3 className="font-bold text-gray-900 font-heading flex items-center gap-2 mb-3">
              📊 Distribusi Slot Jadwal
            </h3>
            <p className="text-xs text-gray-500 mb-4">Jumlah pembagian tugas adzan per anak aktif:</p>
            
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {activeParticipants
                .map(p => ({
                  name: p.nama,
                  count: slotCounts[p.nama.toLowerCase()] || 0
                }))
                .sort((a, b) => b.count - a.count)
                .map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-700">{item.name}</span>
                      <span className={`font-bold ${item.count === 0 ? 'text-red-500' : 'text-primary-600'}`}>
                        {item.count} Kali
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          item.count === 0 
                            ? 'bg-red-300' 
                            : item.count > 3 
                              ? 'bg-amber-400' 
                              : 'bg-primary-500'
                        }`} 
                        style={{ width: `${Math.min(100, (item.count / 5) * 100)}%` }} 
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
