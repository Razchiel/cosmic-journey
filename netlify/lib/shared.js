// ============================================================
// COSMIC JOURNEY: helper bersama untuk Netlify Functions
// Service key hanya dibaca di sini (process.env), tidak pernah masuk bundle front-end.
// ============================================================
import { createHash, randomBytes } from 'node:crypto'

export const CATEGORY_IDS = ['feedback', 'suggestion', 'developer', 'wish']
export const MESSAGE_MIN = 5
export const MESSAGE_MAX = 280
export const NAME_MAX = 30

// ── Respons ──
export function json(body, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders },
    })
}

// Bentuk error selalu: { error: { code, message } }, code = validation | rate_limit | server
export function fail(code, message, status) {
    return json({ error: { code, message } }, status, { 'Cache-Control': 'no-store' })
}

// ── Akses Supabase (PostgREST) dengan service key ──
export function db(path, { method = 'GET', body, headers = {} } = {}) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_KEY
    if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')

    const h = { apikey: key, 'Content-Type': 'application/json', ...headers }
    // Key lama (service_role) berupa JWT dan dikirim juga sebagai Bearer; key baru ("sb_secret_...") hanya lewat apikey.
    if (key.startsWith('eyJ')) h.Authorization = `Bearer ${key}`

    return fetch(`${url.replace(/\/+$/, '')}/rest/v1/${path}`, {
        method,
        headers: h,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
    })
}

// Content-Range: "0-11/35" atau "*/0" → 35 / 0
export function totalFromRange(res) {
    const n = parseInt((res.headers.get('content-range') || '').split('/')[1], 10)
    return Number.isFinite(n) ? n : 0
}

// ── Pembersihan teks (sama dengan di front-end, plus karakter tak terlihat) ──
const INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g

export const cleanName = (s) =>
    String(s ?? '')
        .replace(INVISIBLE, '')
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

export const cleanMessage = (s) =>
    String(s ?? '')
        .replace(/\r\n?/g, '\n')
        .replace(INVISIBLE, '')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()

// ── Filter kata kasar dasar (Inggris + Indonesia). Sengaja pendek; tambah sendiri bila perlu. ──
const BAD_WORDS = [
    'fuck', 'shit', 'bitch', 'cunt', 'nigger', 'faggot', 'whore',
    'anjing', 'bangsat', 'bajingan', 'kontol', 'memek', 'ngentot', 'jancok', 'tolol',
]
const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's' }

export function hasBadWords(text) {
    const t = String(text)
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[013457@$]/g, (c) => LEET[c])
    return BAD_WORDS.some((w) => t.includes(w))
}

// Email / link / nomor telepon → tidak boleh auto-publish (tetap pending untuk dicek manual)
export function needsReview(text) {
    const t = String(text)
    return (
        /[\w.+-]+@[\w-]+\.[\w.-]+/.test(t) ||
        /https?:\/\/|www\./i.test(t) ||
        /\+?\d[\d\s().-]{8,}\d/.test(t)
    )
}

// ── Callsign cadangan bila nama kosong ──
const CALLSIGN_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
export function makeCallsign() {
    const bytes = randomBytes(3)
    return `Astronaut-${Array.from(bytes, (b) => CALLSIGN_CHARS[b % CALLSIGN_CHARS.length]).join('')}`
}

// ── Hash IP bergaram rahasia (IP mentah tidak pernah disimpan) ──
export function hashIp(ip) {
    if (!ip) return null
    const salt = process.env.IP_HASH_SALT || 'cosmic-journey'
    return createHash('sha256').update(`${salt}|${ip}`).digest('hex').slice(0, 32)
}