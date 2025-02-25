'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import AgentList from '@/ui/components/Admin/AgentList';
import AdminSidebar from '@/ui/components/Admin/Sidebar';

export default function AdminPage() {
  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-6">
        <AgentList />
      </main>
    </div>
  );
} 