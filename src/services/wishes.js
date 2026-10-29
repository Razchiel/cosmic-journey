// ============================================================
// COSMIC JOURNEY — Wishes service (Fase 6: backend nyata)
// submitWish → POST /api/submit-wish, getWishes → GET /api/get-wishes
// Kontrak fungsi SAMA dengan versi dummy (Fase 2 & 4); UI tidak berubah.
// Tidak ada service key di sini: semua rahasia hanya ada di Netlify Functions.
// ============================================================

export const MESSAGE_MIN = 5
export const MESSAGE_MAX = 280
export const NAME_MAX = 30
export const PAGE_SIZE = 12

// id = nilai yang dikirim ke backend (whitelist server-side di netlify/lib/shared.js)
export const CATEGORIES = [
    { id: 'feedback', label: 'Feedback' },
    { id: 'suggestion', label: 'Suggestion' },
    { id: 'developer', label: 'About the developer' },
    { id: 'wish', label: 'Just a wish' },
]
const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id))

const API_BASE = '/api'
const SUBMIT_TIMEOUT = 15000
const GET_TIMEOUT = 10000
const ERROR_CODES = new Set(['validation', 'rate_limit', 'network', 'server'])

// ── Callsign anonim: dibuat sekali per sesi (mis. "Astronaut-7F2") ──
const CALLSIGN_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ' // tanpa 0/O/1/I agar tidak membingungkan
let sessionCallsign = null

export function getSessionCallsign() {
    if (sessionCallsign) return sessionCallsign
    const buf = new Uint32Array(3)
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
        window.crypto.getRandomValues(buf)
    } else {
        for (let i = 0; i < buf.length; i++) buf[i] = Math.floor(Math.random() * 4294967296)
    }
    const code = Array.from(buf, (n) => CALLSIGN_CHARS[n % CALLSIGN_CHARS.length]).join('')
    sessionCallsign = `Astronaut-${code}`
    return sessionCallsign
}

// Dipanggil saat pengunjung "pulang ke Bumi" (perjalanan baru = pengunjung baru)
export function resetSessionCallsign() {
    sessionCallsign = null
}

// ── Pembersihan teks (server melakukan hal yang sama dan tetap menjadi penentu) ──
const cleanName = (s) =>
    String(s ?? '').replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ').replace(/\s+/g, ' ').trim()

const cleanMessage = (s) =>
    String(s ?? '')
        .replace(/\r\n?/g, '\n')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

function fail(code, message) {
    const err = new Error(message)
    err.code = code
    return err
}

// ── Pemanggil HTTP: semua kegagalan diubah menjadi Error ber-.code ──
async function request(path, { method = 'GET', body, timeout }) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeout)
    try {
        let res
        try {
            res = await fetch(`${API_BASE}/${path}`, {
                method,
                headers: body ? { 'Content-Type': 'application/json' } : undefined,
                body: body ? JSON.stringify(body) : undefined,
                signal: ctrl.signal,
            })
        } catch (_) {
            // offline, DNS, timeout, atau diblokir
            throw fail('network', 'Could not reach the observatory.')
        }

        // Bila backend mati / /api tidak ada, server bisa membalas HTML (bukan JSON) → data = null
        let data = null
        try { data = await res.json() } catch (_) { /* bukan JSON */ }

        if (!res.ok) {
            const e = data?.error
            if (e && ERROR_CODES.has(e.code)) {
                throw fail(e.code, typeof e.message === 'string' ? e.message : 'Something went wrong.')
            }
            throw fail(res.status === 429 ? 'rate_limit' : 'server', 'The observatory is quiet right now.')
        }
        if (!data || typeof data !== 'object') {
            throw fail('server', 'The observatory is quiet right now.')
        }
        return data
    } finally {
        clearTimeout(timer)
    }
}

/**
 * Kontrak (sama seperti sebelumnya):
 *   submitWish({ displayName, isAnonymous, category, message, rating, isPrivate, consent, website })
 *   → Promise<record>  atau throw Error dengan .code: 'validation' | 'rate_limit' | 'network' | 'server'
 *   record = { id, displayName, isAnonymous, category, message, rating, isPrivate, createdAt, status }
 * `website` = field honeypot (harus kosong; server membalas sukses palsu tanpa menyimpan bila terisi).
 * POST TIDAK di-retry otomatis agar tidak terjadi kiriman ganda.
 */
export async function submitWish(payload) {
    // Pemeriksaan cepat di klien (server tetap memvalidasi ulang secara ketat)
    const message = cleanMessage(payload?.message)
    const rating = Number(payload?.rating)
    const isPrivate = Boolean(payload?.isPrivate)

    if (message.length < MESSAGE_MIN || message.length > MESSAGE_MAX) {
        throw fail('validation', `Your message needs ${MESSAGE_MIN} to ${MESSAGE_MAX} characters.`)
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw fail('validation', 'Please choose a rating from 1 to 5 stars.')
    }
    if (!CATEGORY_IDS.has(payload?.category)) {
        throw fail('validation', 'Please choose a category.')
    }
    if (!isPrivate && !payload?.consent) {
        throw fail('validation', 'Please agree to show your message in the Gallery, or send it privately.')
    }

    const isAnonymous = Boolean(payload?.isAnonymous)
    const displayName = cleanName(payload?.displayName).slice(0, NAME_MAX) || getSessionCallsign()

    const record = await request('submit-wish', {
        method: 'POST',
        timeout: SUBMIT_TIMEOUT,
        body: {
            displayName,
            isAnonymous,
            category: payload.category,
            message,
            rating,
            isPrivate,
            consent: Boolean(payload?.consent),
            website: typeof payload?.website === 'string' ? payload.website : '',
        },
    })

    if (!record.id || typeof record.message !== 'string') {
        throw fail('server', 'The observatory is quiet right now.')
    }
    return record
}

/**
 * Kontrak (sama seperti sebelumnya):
 *   getWishes({ sort = 'newest' | 'rating', category = 'all' | <id kategori>, cursor = null, limit = 12 })
 *   → Promise<{
 *        items: [{ id, displayName, isAnonymous, category, message, rating, createdAt }],
 *        nextCursor: string | null,     // opaque: kirim balik apa adanya; null = sudah habis
 *        total: number,                 // jumlah item yang cocok dengan filter kategori
 *        aggregate: { average: number, count: number }  // semua wish publik, TIDAK terpengaruh filter
 *     }>
 *   atau throw Error dengan .code: 'validation' | 'network' | 'server'
 * GET aman di-retry: satu kali ulang bila jaringan gagal.
 */
export async function getWishes({ sort = 'newest', category = 'all', cursor = null, limit = PAGE_SIZE } = {}) {
    if (sort !== 'newest' && sort !== 'rating') throw fail('validation', 'Unknown sort.')
    if (category !== 'all' && !CATEGORY_IDS.has(category)) throw fail('validation', 'Unknown category.')
    const pageSize = Math.min(50, Math.max(1, Math.floor(Number(limit)) || PAGE_SIZE))

    const q = new URLSearchParams({ sort, category, limit: String(pageSize) })
    if (cursor) q.set('cursor', String(cursor))
    const path = `get-wishes?${q}`

    let data
    try {
        data = await request(path, { timeout: GET_TIMEOUT })
    } catch (err) {
        if (err.code !== 'network') throw err
        await wait(700)
        data = await request(path, { timeout: GET_TIMEOUT })
    }

    if (!Array.isArray(data.items) || !data.aggregate) {
        throw fail('server', 'The observatory is quiet right now.')
    }
    return {
        items: data.items,
        nextCursor: typeof data.nextCursor === 'string' ? data.nextCursor : null,
        total: Number(data.total) || 0,
        aggregate: {
            count: Number(data.aggregate.count) || 0,
            average: Number(data.aggregate.average) || 0,
        },
    }
}