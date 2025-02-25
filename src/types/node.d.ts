declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
    NEXT_PUBLIC_WS_URL: string;
  }

  interface Process {
    env: ProcessEnv;
  }
}

declare var process: NodeJS.Process; 