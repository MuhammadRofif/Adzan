import React, { useState } from 'react';
import { Settings as SettingsIcon, Moon, Sun, Bell, Shield, Database, ChevronRight, Info } from 'lucide-react';
import { SectionHeader, Card, ProgressBar } from '../components/ui/index';
import { Button } from '../components/ui/Button';
import { useApp } from '../context/AppContext';
import { cn } from '../utils/cn';

const SettingRow: React.FC<{ icon: React.ReactNode; title: string; description: string; action: React.ReactNode; color?: string }> = ({ icon, title, description, action, color = 'bg-gray-100 text-gray-500' }) => (
  <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0 gap-4">
    <div className="flex items-center gap-4">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', color)}>{icon}</div>
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
    <div className="flex-shrink-0">{action}</div>
  </div>
);

const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <button onClick={onChange} className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200', checked ? 'bg-primary-600' : 'bg-gray-200')}>
    <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm', checked ? 'translate-x-6' : 'translate-x-1')} />
  </button>
);

export const Settings: React.FC = () => {
  const { participants, budgetStatus, showToast } = useApp();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoReset, setAutoReset] = useState(true);
  const [budgetInput, setBudgetInput] = useState((budgetStatus.totalBudget / 1000).toString());

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <SectionHeader title="Pengaturan" subtitle="Konfigurasi sistem adzan challenge" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appearance */}
        <Card>
          <h2 className="font-bold text-gray-900 font-heading mb-4 flex items-center gap-2">
            <Sun className="w-5 h-5 text-orange-400" /> Tampilan
          </h2>
          <SettingRow icon={<Moon className="w-5 h-5" />} title="Dark Mode" description="Tampilan gelap untuk kenyamanan" color="bg-indigo-100 text-indigo-500"
            action={<Toggle checked={darkMode} onChange={() => { setDarkMode(!darkMode); showToast('Dark mode belum didukung', 'info'); }} />} />
          <SettingRow icon={<Bell className="w-5 h-5" />} title="Notifikasi" description="Tampilkan notifikasi aktivitas" color="bg-blue-100 text-blue-500"
            action={<Toggle checked={notifications} onChange={() => setNotifications(!notifications)} />} />
        </Card>

        {/* System */}
        <Card>
          <h2 className="font-bold text-gray-900 font-heading mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-500" /> Sistem
          </h2>
          <SettingRow icon={<Database className="w-5 h-5" />} title="Reset Kuota Mingguan" description="Otomatis reset setiap Senin 00:00" color="bg-primary-100 text-primary-500"
            action={<Toggle checked={autoReset} onChange={() => setAutoReset(!autoReset)} />} />
          <SettingRow icon={<SettingsIcon className="w-5 h-5" />} title="Export Data" description="Ekspor semua data ke CSV" color="bg-emerald-100 text-emerald-500"
            action={<Button size="sm" variant="outline" onClick={() => showToast('Export data berhasil!', 'success')}>Export CSV</Button>} />
        </Card>

        {/* Budget Config */}
        <Card className="md:col-span-2">
          <h2 className="font-bold text-gray-900 font-heading mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-emerald-500" /> Konfigurasi Budget
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Budget Bulanan (dalam ribu rupiah)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                  <input className="input pl-10" type="number" min="0" value={budgetInput} onChange={e => setBudgetInput(e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">ribu</span>
                </div>
                <Button onClick={() => showToast('Budget berhasil diperbarui (mock).', 'success')}>Simpan</Button>
              </div>
              <p className="mt-2 text-xs text-gray-400">Budget saat ini: Rp {(budgetStatus.totalBudget / 1000).toFixed(0)}k/bulan</p>
            </div>
            <div>
              <label className="label">Penggunaan Saat Ini</label>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-2xl font-bold font-heading text-gray-900 mb-1">{budgetStatus.usagePercent}%</p>
                <ProgressBar value={budgetStatus.usagePercent} color={budgetStatus.usagePercent >= 80 ? 'bg-amber-500' : 'bg-primary-500'} className="mb-2" />
                <p className="text-xs text-gray-500">Rp {(budgetStatus.usedBudget / 1000).toFixed(0)}k / {(budgetStatus.totalBudget / 1000).toFixed(0)}k</p>
              </div>
            </div>
          </div>
        </Card>

        {/* About */}
        <Card className="md:col-span-2">
          <h2 className="font-bold text-gray-900 font-heading mb-4">Tentang Sistem</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Versi', value: '1.0.0' },
              { label: 'Total Peserta', value: participants.length.toString() },
              { label: 'Maks Peserta', value: '12' },
              { label: 'Poin Adzan', value: '+10' },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-4">
                <p className="text-xl font-bold text-gray-900 font-heading">{item.value}</p>
                <p className="text-xs text-gray-500 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-primary-50 border border-primary-100 rounded-xl p-4">
            <p className="text-sm text-primary-800 font-medium mb-1">📋 Sistem Poin</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-primary-700">
              {[['Kehadiran', '+5 poin'], ['Adzan', '+10 poin'], ['Sikap Bagus', '+5 poin'], ['Sikap Kurang', '+3 poin']].map(([k, v]) => (
                <div key={k} className="bg-white/50 rounded-lg p-2">
                  <p className="font-semibold">{k}</p>
                  <p>{v}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
