import { cookies } from "next/headers";
import crypto from "node:crypto";

import {
  getAuthSecret,
  SESSION_COOKIE_NAME as COOKIE_NAME,
  SESSION_MAX_AGE as MAX_AGE_SECONDS,
} from "./auth-edge";

/**
 * 本模块运行在 Node.js Runtime（Server Component / Server Action / Route Handler），
 * 可以安全使用 `node:crypto`。Edge Runtime（middleware）请使用 `./auth-edge`；
 * 常量与密钥读取逻辑已抽到该文件，保证两端签名算法严格一致。
 */

function getSecret(): string {
  return getAuthSecret();
}

/** 生成登录 session token：payload.signature（HMAC-SHA256） */
export function createSessionToken(): string {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `admin.${expiresAt}`;
  const signature = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

/** 校验 session token 是否有效且未过期 */
export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [role, expiresAtRaw, signature] = parts;
  const expiresAt = Number(expiresAtRaw);
  if (!role || role !== "admin") return false;
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(`${role}.${expiresAtRaw}`)
    .digest("hex");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** 校验后台密码 */
export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // 长度不同直接失败，但仍做一次比较以减少时序差异
    crypto.timingSafeEqual(Buffer.alloc(32), Buffer.alloc(32));
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

/** 服务端读取当前登录状态 */
export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}

/** 服务端读取 Cookie 名称，供 Server Action / Route Handler 设置 */
export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_MAX_AGE = MAX_AGE_SECONDS;
