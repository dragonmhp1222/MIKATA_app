/**
 * /api/generate のクライアント待ちとサーバー maxDuration の整合用。
 * サーバーが先にタイムアウトすると 504 の HTML が返り、fetch 側が JSON を解釈できない。
 * そのため必ず: maxDuration（秒）> clientTimeoutMs / 1000（余裕を見て数秒以上差を付ける）。
 *
 * maxDuration は Next の制約で `route.ts` にリテラルで書くため、この定数と同じ数値をそちらにも書く（二重管理）。
 *
 * Vercel の無料枠などで maxDuration が実際より短く制限される場合は、client 側をその実効上限より短く調整する。
 */
export const GENERATE_CLIENT_TIMEOUT_MS = 90_000;
/** `app/api/generate/route.ts` の `export const maxDuration` と同じ秒数 */
export const GENERATE_SERVER_MAX_DURATION_SEC = 120;
