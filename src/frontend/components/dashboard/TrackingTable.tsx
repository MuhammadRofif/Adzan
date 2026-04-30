import React from 'react';
import { MoreVertical } from 'lucide-react';
import { Button } from '../ui/Button';

// Mock data
const participants = [
  { id: 1, name: 'Ahmad Faiz', status: 'Aktif', adzanCount: 15, points: 350, lastActive: 'Hari ini' },
  { id: 2, name: 'Budi Santoso', status: 'Aktif', adzanCount: 12, points: 280, lastActive: 'Hari ini' },
  { id: 3, name: 'Zidan Al-Faruq', status: 'Baru', adzanCount: 5, points: 120, lastActive: 'Kemarin' },
  { id: 4, name: 'Reza Pratama', status: 'Tidak Aktif', adzanCount: 2, points: 40, lastActive: '3 hari lalu' },
  { id: 5, name: 'Muhammad Ali', status: 'Aktif', adzanCount: 18, points: 410, lastActive: 'Hari ini' },
];

export const TrackingTable: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 font-heading">Leaderboard Adzan</h2>
          <p className="text-sm text-gray-500">Bulan Sya'ban 1445 H</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 outline-none">
            <option>Semua Status</option>
            <option>Aktif</option>
            <option>Baru</option>
          </select>
          <Button variant="outline" size="md">Filter</Button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="bg-gray-50/50 text-xs text-gray-700 uppercase">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-500">Peringkat</th>
              <th className="px-6 py-4 font-semibold text-gray-500">Nama Peserta</th>
              <th className="px-6 py-4 font-semibold text-gray-500">Status</th>
              <th className="px-6 py-4 font-semibold text-gray-500">Jumlah Adzan</th>
              <th className="px-6 py-4 font-semibold text-gray-500">Total Poin</th>
              <th className="px-6 py-4 font-semibold text-gray-500 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {participants.map((person, index) => (
              <tr key={person.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {index < 3 ? (
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                      index === 0 ? 'bg-yellow-100 text-yellow-600' :
                      index === 1 ? 'bg-gray-200 text-gray-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {index + 1}
                    </span>
                  ) : (
                    <span className="text-gray-400 font-medium">{index + 1}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
                      {person.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{person.name}</div>
                      <div className="text-xs text-gray-400">Terakhir: {person.lastActive}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    person.status === 'Aktif' ? 'bg-green-100 text-green-700' :
                    person.status === 'Baru' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {person.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                  {person.adzanCount} <span className="text-gray-400 font-normal text-xs ml-1">kali</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-bold text-primary-600">{person.points}</span>
                  <span className="text-gray-400 text-xs ml-1">pts</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <Button variant="ghost" className="p-1.5 rounded-md hover:bg-gray-100">
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex justify-center">
        <Button variant="ghost" size="sm" className="text-primary-600 font-medium">Lihat Semua Data</Button>
      </div>
    </div>
  );
};
