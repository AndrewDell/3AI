'use client';

import React from 'react';
import { MonitoringDashboard } from '@/ui/components/Dashboard/MonitoringDashboard';

export default function HomePage() {
  return (
    <MonitoringDashboard 
      refreshInterval={5000}
      showDetailedView={true}
    />
  );
} 