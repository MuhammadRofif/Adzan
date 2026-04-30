import React from 'react';
import { Users, Award, Target, Coins } from 'lucide-react';

const stats = [
  { name: 'Total Peserta', value: '45', change: '+3', changeType: 'positive', icon: Users, color: 'bg-blue-500' },
  { name: 'Total Adzan (Bulan Ini)', value: '128', change: '+12%', changeType: 'positive', icon: Target, color: 'bg-primary-500' },
  { name: 'Rata-rata Poin', value: '240', change: '-5', changeType: 'negative', icon: Award, color: 'bg-orange-500' },
  { name: 'Sisa Budget', value: 'Rp 450.000', change: '80% Terpakai', changeType: 'neutral', icon: Coins, color: 'bg-indigo-500' },
];

export const StatCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {stats.map((stat) => (
        <div key={stat.name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900 font-heading">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10 text-white group-hover:scale-110 transition-transform duration-300`}>
              <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
            </div>
          </div>
          <div className="mt-4">
            <span
              className={`inline-flex items-center text-xs font-semibold rounded-full px-2 py-1 ${
                stat.changeType === 'positive' ? 'bg-green-100 text-green-700' : 
                stat.changeType === 'negative' ? 'bg-red-100 text-red-700' : 
                'bg-gray-100 text-gray-700'
              }`}
            >
              {stat.change}
            </span>
            <span className="text-xs text-gray-400 ml-2">vs bulan lalu</span>
          </div>
        </div>
      ))}
    </div>
  );
};
