'use client';

import { Card, Title, Select, SelectItem, AreaChart } from "@tremor/react";
import { useState, useEffect } from "react";

interface DataPoint {
  timestamp: string;
  cpu: number;
  memory: number;
  network: number;
}

const REFRESH_INTERVALS = [
  { value: "1000", label: "1s refresh" },
  { value: "5000", label: "5s refresh" },
  { value: "15000", label: "15s refresh" },
] as const;

export default function MonitoringChart() {
  const [interval, setInterval] = useState<string>("5000");
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    const updateData = () => {
      const now = new Date();
      const newPoint: DataPoint = {
        timestamp: now.toLocaleTimeString(),
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        network: Math.random() * 100,
      };

      setData(prev => [...prev.slice(-20), newPoint]);
    };

    const timerId = window.setInterval(updateData, parseInt(interval, 10));
    return () => window.clearInterval(timerId);
  }, [interval]);

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <Title>Live System Monitoring</Title>
        <Select
          value={interval}
          onValueChange={setInterval}
          className="w-40"
        >
          {REFRESH_INTERVALS.map(({ value, label }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </Select>
      </div>

      <AreaChart
        className="h-72 mt-4"
        data={data}
        index="timestamp"
        categories={["cpu", "memory", "network"]}
        colors={["blue", "green", "red"]}
        valueFormatter={(value: number) => `${value.toFixed(1)}%`}
        showLegend
        showGridLines
        showAnimation
      />
    </Card>
  );
} 