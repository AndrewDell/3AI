declare module 'socket.io-client' {
  export interface Socket {
    on(event: string, cb: (data: any) => void): void;
    close(): void;
  }
  export function io(url: string, opts?: any): Socket;
}

declare module 'recharts' {
  import { FC, ReactNode, ReactElement } from 'react';

  interface CommonProps {
    children?: ReactNode;
    width?: string | number;
    height?: string | number;
    data?: any[];
    className?: string;
  }

  interface LineProps extends CommonProps {
    type?: 'monotone' | 'linear';
    dataKey: string;
    stroke?: string;
    name?: string;
  }

  interface AxisProps extends CommonProps {
    dataKey?: string;
  }

  interface ChartProps extends CommonProps {
    children: ReactNode;
  }

  export const LineChart: FC<ChartProps>;
  export const Line: FC<LineProps>;
  export const XAxis: FC<AxisProps>;
  export const YAxis: FC<AxisProps>;
  export const CartesianGrid: FC<{ strokeDasharray?: string }>;
  export const Tooltip: FC<CommonProps>;
  export const ResponsiveContainer: FC<CommonProps>;
}

declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_WS_URL: string;
  }
} 