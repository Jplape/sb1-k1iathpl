interface DenoEnv {
  get(key: string): string | undefined;
}

declare namespace Deno {
  const env: DenoEnv;
}