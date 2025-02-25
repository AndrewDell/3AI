'use client';

import { BellIcon, WrenchIcon } from "@heroicons/react/24/outline";
import { Badge, Button } from "@tremor/react";
import { useState } from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isConnected, setIsConnected] = useState(true);
  const [notificationCount, setNotificationCount] = useState(3);

  const handleMaintenanceToggle = () => {
    // TODO: Implement maintenance mode toggle
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white py-4 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">3AI Admin</h1>
              <Badge
                color={isConnected ? "green" : "red"}
                size="sm"
              >
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>

            {/* Admin Quick Actions */}
            <div className="flex items-center space-x-4">
              <Button 
                variant="secondary" 
                onClick={handleMaintenanceToggle}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white"
              >
                <WrenchIcon className="h-4 w-4" />
                Maintenance Mode
              </Button>
              <div className="relative">
                <Button
                  variant="secondary"
                  className="bg-white/10 hover:bg-white/20 text-white p-2"
                  aria-label="Admin notifications"
                >
                  <BellIcon className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                    {notificationCount}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
} 