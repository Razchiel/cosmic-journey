// ============================================================
// POST /api/submit-wish
// Validasi ketat server-side → honeypot → rate limit + cek duplikat → simpan.
// Default status 'pending'. AUTO_APPROVE=true → 'approved' (hanya pesan publik tanpa email/link/telepon).
// Pesan private tersimpan tetapi TIDAK PERNAH dikembalikan oleh get-wishes.
// ============================================================
import {
    CATEGORY_IDS,
    MESSAGE_MIN,
    MESSAGE_MAX,
    NAME_MAX,
    cleanMessage,
    cleanName,
    db,
    fail,
    hasBadWords,
    hashIp,
    json,
    makeCallsign,
    needsReview,
} from '../lib/shared.js'

const LIMIT_PER_HOUR = 10
const LIMIT_PER_DAY = 30
const MAX_BODY = 4000
const HOUR_MS = 3600 * 1000
const DAY_MS = 24 * HOUR_MS

// Satu query untuk dua keperluan: rate limit (jumlah per jam / per hari) dan cek duplikat (24 jam terakhir)
async function recentFromIp(ipHash) {
    const q = new URLSearchParams({
        select: 'message,created_at',
        ip_hash: `eq.${ipHash}`,
        created_at: `gte.${new Date(Date.now() - DAY_MS).toISOString()}`,
        order: 'created_at.desc',
        limit: '20',
    })
    const res = await db(`wishes?${q}`)
    if (!res.ok) throw new Error(`recent check failed (${res.status})`)
    const rows = await res.json()
    return Array.isArray(rows) ? rows : []
}

// Normalisasi untuk membandingkan pesan: huruf kecil, tanpa aksen, tanpa tanda baca, spasi dirapikan
const normalize = (s) =>
    String(s)
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim()

const toRecord = (r) => ({
    id: r.id,
    displayName: r.display_name,
    isAnonymous: r.is_anonymous,
    category: r.category,
    message: r.message,
    rating: r.rating,
    isPrivate: r.is_private,
    createdAt: r.created_at,
    status: r.status,
})

export default async (req, context) => {
    if (req.method !== 'POST') return fail('validation', 'Method not allowed.', 405)

    // ── Baca body ──
    let data
    try {
        const raw = await req.text()
        if (raw.length > MAX_BODY) return fail('validation', 'That message is too large.', 413)
        data = JSON.parse(raw)
    } catch (_) {
        return fail('validation', 'We could not read that request.', 400)
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return fail('validation', 'We could not read that request.', 400)
    }

    // ── Validasi & pembersihan ──
    const message = cleanMessage(data.message)
    if (message.length < MESSAGE_MIN || message.length > MESSAGE_MAX) {
        return fail('validation', `Your message needs ${MESSAGE_MIN} to ${MESSAGE_MAX} characters.`, 400)
    }
    const rating = data.rating
    if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
        return fail('validation', 'Please choose a rating from 1 to 5 stars.', 400)
    }
    const category = data.category
    if (typeof category !== 'string' || !CATEGORY_IDS.includes(category)) {
        return fail('validation', 'Please choose a category.', 400)
    }
    const isPrivate = data.isPrivate === true
    if (!isPrivate && data.consent !== true) {
        return fail('validation', 'Please agree to show your message in the Gallery, or send it privately.', 400)
    }

    let displayName = cleanName(data.displayName).slice(0, NAME_MAX)
    const isAnonymous = data.isAnonymous === true || !displayName
    if (!displayName) displayName = makeCallsign()

    if (hasBadWords(message) || hasBadWords(displayName)) {
        return fail('validation', 'Please keep your words kind. Try rephrasing your message.', 400)
    }

    // ── Honeypot: bot mengisi field tersembunyi → pura-pura sukses, tidak disimpan ──
    if (typeof data.website === 'string' && data.website.trim() !== '') {
        return json(
            {
                id: `ghost-${Date.now().toString(36)}`,
                displayName, isAnonymous, category, message, rating, isPrivate,
                createdAt: new Date().toISOString(),
                status: 'pending',
            },
            201,
            { 'Cache-Control': 'no-store' }
        )
    }

    try {
        // ── Rate limit + cek duplikat per IP-hash ──
        const ipHash = hashIp(context?.ip || req.headers.get('x-nf-client-connection-ip'))
        if (ipHash) {
            const recent = await recentFromIp(ipHash)
            const hourAgo = Date.now() - HOUR_MS
            const lastHour = recent.filter((r) => Date.parse(r.created_at) >= hourAgo).length

            if (lastHour >= LIMIT_PER_HOUR || recent.length >= LIMIT_PER_DAY) {
                return fail('rate_limit', 'You have sent a few wishes already. Please come back later.', 429)
            }

            // Pesan yang sama persis dari IP yang sama dalam 24 jam → tolak ramah.
            // Pesan sama dari orang lain (IP berbeda) tetap boleh.
            const mine = normalize(message)
            if (recent.some((r) => normalize(r.message) === mine)) {
                return fail('validation', 'You already sent this wish. Try a new one.', 409)
            }
        }

        // ── Status awal ──
        const autoApprove =
            process.env.AUTO_APPROVE === 'true' &&
            !isPrivate &&
            !needsReview(message) &&
            !needsReview(displayName)

        // ── Simpan ──
        const res = await db('wishes', {
            method: 'POST',
            headers: { Prefer: 'return=representation' },
            body: {
                display_name: displayName,
                is_anonymous: isAnonymous,
                category,
                message,
                rating,
                is_private: isPrivate,
                status: autoApprove ? 'approved' : 'pending',
                ip_hash: ipHash,
            },
        })
        if (!res.ok) {
            let code = ''
            try { code = (await res.json())?.code || '' } catch (_) { /* abaikan */ }
            throw new Error(`insert failed (${res.status} ${code})`)
        }
        const rows = await res.json()
        return json(toRecord(rows[0]), 201, { 'Cache-Control': 'no-store' })
    } catch (err) {
        console.error('[submit-wish]', err?.message || err) // tanpa isi pesan / IP
        return fail('server', 'The observatory is quiet right now. Please try again soon.', 500)
    }
}