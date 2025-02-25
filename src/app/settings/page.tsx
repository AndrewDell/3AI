'use client';

import { Card, Title, Text, Grid, Col, Flex, Badge, Metric, TextInput, Select, SelectItem, Switch } from "@tremor/react";
import { useState } from "react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState('light');
  const [refreshInterval, setRefreshInterval] = useState('5000');

  return (
    <main className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Grid numItems={1} numItemsMd={2} className="gap-6">
        {/* General Settings */}
        <Card>
          <Title>General Settings</Title>
          <div className="mt-6 space-y-6">
            <div>
              <Text>Theme</Text>
              <Select
                value={theme}
                onValueChange={setTheme}
                className="mt-2"
              >
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </Select>
            </div>

            <div>
              <Text>Dashboard Refresh Interval</Text>
              <Select
                value={refreshInterval}
                onValueChange={setRefreshInterval}
                className="mt-2"
              >
                <SelectItem value="1000">1 second</SelectItem>
                <SelectItem value="5000">5 seconds</SelectItem>
                <SelectItem value="15000">15 seconds</SelectItem>
                <SelectItem value="30000">30 seconds</SelectItem>
              </Select>
            </div>

            <div>
              <Flex justifyContent="between" className="space-x-4">
                <div>
                  <Text>Push Notifications</Text>
                  <Text className="text-tremor-content-subtle">Receive notifications about important updates</Text>
                </div>
                <Switch
                  checked={notifications}
                  onChange={setNotifications}
                />
              </Flex>
            </div>
          </div>
        </Card>

        {/* API Settings */}
        <Card>
          <Title>API Settings</Title>
          <div className="mt-6 space-y-6">
            <div>
              <Text>API Endpoint</Text>
              <TextInput
                placeholder="https://api.example.com"
                className="mt-2"
              />
            </div>

            <div>
              <Text>API Key</Text>
              <TextInput
                type="password"
                placeholder="Enter your API key"
                className="mt-2"
              />
            </div>

            <div>
              <Text>Rate Limit</Text>
              <Select defaultValue="1000" className="mt-2">
                <SelectItem value="100">100 requests/min</SelectItem>
                <SelectItem value="500">500 requests/min</SelectItem>
                <SelectItem value="1000">1000 requests/min</SelectItem>
                <SelectItem value="unlimited">Unlimited</SelectItem>
              </Select>
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card>
          <Title>Notification Settings</Title>
          <div className="mt-6 space-y-4">
            <Flex justifyContent="between" className="space-x-4">
              <div>
                <Text>Email Notifications</Text>
                <Text className="text-tremor-content-subtle">Receive daily summary</Text>
              </div>
              <Switch defaultChecked />
            </Flex>

            <Flex justifyContent="between" className="space-x-4">
              <div>
                <Text>Error Alerts</Text>
                <Text className="text-tremor-content-subtle">Get notified about system errors</Text>
              </div>
              <Switch defaultChecked />
            </Flex>

            <Flex justifyContent="between" className="space-x-4">
              <div>
                <Text>Performance Alerts</Text>
                <Text className="text-tremor-content-subtle">Monitor system performance</Text>
              </div>
              <Switch defaultChecked />
            </Flex>
          </div>
        </Card>

        {/* Security Settings */}
        <Card>
          <Title>Security Settings</Title>
          <div className="mt-6 space-y-6">
            <div>
              <Text>Two-Factor Authentication</Text>
              <Flex justifyContent="between" className="mt-2 space-x-4">
                <Text className="text-tremor-content-subtle">Enhance your account security</Text>
                <Switch defaultChecked />
              </Flex>
            </div>

            <div>
              <Text>Session Timeout</Text>
              <Select defaultValue="30" className="mt-2">
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </Select>
            </div>

            <div>
              <Text>IP Whitelist</Text>
              <TextInput
                placeholder="Enter IP addresses (comma separated)"
                className="mt-2"
              />
            </div>
          </div>
        </Card>
      </Grid>

      <div className="flex justify-end space-x-4">
        <button 
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => console.log('Cancel changes')}
        >
          Cancel
        </button>
        <button 
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          onClick={() => console.log('Save changes')}
        >
          Save Changes
        </button>
      </div>
    </main>
  );
} 