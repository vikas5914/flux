/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  readonly VITE_TMDB_API_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
