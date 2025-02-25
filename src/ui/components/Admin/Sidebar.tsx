'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

const menuItems = [
  { name: 'Dashboard', href: '/', icon: '🏠' },
  { name: 'Agents', href: '/admin', icon: '👥' },
  { name: 'Analytics', href: '/analytics', icon: '📊' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white shadow-lg">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">3AI Admin</h2>
          <div className="flex items-center mt-2 text-sm text-gray-600">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
            System Online
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.name}>
                <a
                  href={item.href}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>v1.0.0</span>
            <button
              className="p-2 hover:bg-gray-100 rounded-full relative"
              aria-label="Notifications"
            >
              <span className="text-lg">🔔</span>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
} 