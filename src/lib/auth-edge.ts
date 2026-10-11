/**
 * Edge 兼容的会话校验工具
 *
 * 为什么需要这个文件：
 * - `src/middleware.ts` 运行在 Edge Runtime 中，不能引入 `node:crypto`；
 * - 因此这里用 Web Crypto API（`crypto.subtle`）重新实现一份 HMAC-SHA256 签名校验；
 * - 签名算法、payload 结构、过期时间必须与 `src/lib/auth.ts` 严格一致，
 *   所以常量与密钥读取逻辑也集中放在本文件，`src/lib/auth.ts` 复用这里的实现。
 */

export const SESSION_COOKIE_NAME = 'nav_admin_session';

/** 会话有效期：7 天（秒） */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const DEFAULT_SECRET = 'nav-cms-dev-secret';

/** 读取签名密钥（与 auth.ts 保持一致的降级顺序） */
export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || DEFAULT_SECRET;
  return secret;
}

const textEncoder = new TextEncoder();

function bytesToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/** 使用 Web Crypto API 计算 HMAC-SHA256 签名（hex 小写） */
async function signHmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(message));
  return bytesToHex(signature);
}

/** 定长字符串的常量时间比较，避免长度差异直接短路 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** token 结构：`admin.<expiresAt>.<hexSignature>` */
export interface ParsedSessionToken {
  role: string;
  expiresAt: number;
  signature: string;
}

/** 解析 token（不校验签名），结构非法时返回 null */
export function parseSessionToken(token: string | undefined | null): ParsedSessionToken | null {
  if (!token) {
    return null;
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  const [role, expiresAtRaw, signature] = parts;
  if (role !== 'admin' || !expiresAtRaw || !signature) {
    return null;
  }
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt)) {
    return null;
  }
  return { role, expiresAt, signature };
}

/**
 * 校验 session token（Edge 版本，异步）
 *
 * @param token cookie 中携带的 token
 * @returns 是否为未过期且签名正确的管理员会话
 */
export async function verifySessionTokenEdge(
  token: string | undefined | null,
): Promise<boolean> {
  const parsed = parseSessionToken(token);
  if (!parsed) {
    return false;
  }
  if (Date.now() > parsed.expiresAt) {
    return false;
  }
  if (!/^[0-9a-fA-F]{64}$/.test(parsed.signature)) {
    return false;
  }

  const expected = await signHmacSha256Hex(getAuthSecret(), `${parsed.role}.${parsed.expiresAt}`);
  return timingSafeEqual(parsed.signature.toLowerCase(), expected);
}
