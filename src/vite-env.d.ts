/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Apps Script web app URL that receives waitlist signups. Optional. */
  readonly VITE_WAITLIST_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
