// ============================================================
// GET /api/get-wishes?sort=newest|rating&category=all|<id>&cursor=<opaque>&limit=12
// Hanya status 'approved' dan is_private = false. Field status/is_private/ip_hash tidak pernah keluar.
// Kontrak respons sama dengan getWishes() di src/services/wishes.js:
//   { items, nextCursor, total, aggregate: { average, count } }
// ============================================================
import { CATEGORY_IDS, db, fail, json, totalFromRange } from '../lib/shared.js'

const PAGE_DEFAULT = 12
const PAGE_MAX = 50
const OFFSET_MAX = 2000
const COLUMNS = 'id,display_name,is_anonymous,category,message,rating,created_at'

const ORDER = {
    newest: 'created_at.desc,id.desc',
    rating: 'rating.desc,created_at.desc,id.desc',
}

// Cursor "opaque" = offset dalam base64url. Klien mengirim balik apa adanya.
const encodeCursor = (n) => Buffer.from(String(n)).toString('base64url')
function decodeCursor(c) {
    if (!c) return 0
    if (c.length > 24) return null
    const n = Number(Buffer.from(c, 'base64url').toString())
    return Number.isInteger(n) && n >= 0 && n <= OFFSET_MAX ? n : null
}

const CACHE_HEADERS = {
    // Browser: 30 dtk. CDN Netlify: 60 dtk + stale-while-revalidate (hemat kuota Supabase & function).
    'Cache-Control': 'public, max-age=30',
    'Netlify-CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
}

export default async (req) => {
    if (req.method !== 'GET') return fail('validation', 'Method not allowed.', 405)

    const params = new URL(req.url).searchParams
    const sort = params.get('sort') || 'newest'
    const category = params.get('category') || 'all'
    const offset = decodeCursor(params.get('cursor'))
    const limit = Math.min(PAGE_MAX, Math.max(1, parseInt(params.get('limit'), 10) || PAGE_DEFAULT))

    if (!ORDER[sort]) return fail('validation', 'Unknown sort.', 400)
    if (category !== 'all' && !CATEGORY_IDS.includes(category)) return fail('validation', 'Unknown category.', 400)
    if (offset === null) return fail('validation', 'Invalid cursor.', 400)

    try {
        const q = new URLSearchParams({
            select: COLUMNS,
            status: 'eq.approved',
            is_private: 'eq.false',
            order: ORDER[sort],
            limit: String(limit),
            offset: String(offset),
        })
        if (category !== 'all') q.set('category', `eq.${category}`)

        const [listRes, statsRes] = await Promise.all([
            db(`wishes?${q}`, { headers: { Prefer: 'count=exact' } }),
            db('rpc/wish_stats', { method: 'POST', body: {} }),
        ])

        // 416 = offset melewati jumlah baris → anggap halaman kosong
        let rows = []
        let total = 0
        if (listRes.status === 416) {
            total = totalFromRange(listRes)
        } else if (listRes.ok) {
            rows = await listRes.json()
            total = totalFromRange(listRes)
        } else {
            throw new Error(`list failed (${listRes.status})`)
        }

        if (!statsRes.ok) throw new Error(`stats failed (${statsRes.status})`)
        const stats = (await statsRes.json())?.[0] || {}

        const items = rows.map((r) => ({
            id: r.id,
            displayName: r.display_name,
            isAnonymous: r.is_anonymous,
            category: r.category,
            message: r.message,
            rating: r.rating,
            createdAt: r.created_at,
        }))

        const nextCursor = offset + items.length < total && items.length > 0
            ? encodeCursor(offset + items.length)
            : null

        return json(
            {
                items,
                nextCursor,
                total,
                aggregate: { count: Number(stats.count) || 0, average: Number(stats.average) || 0 },
            },
            200,
            CACHE_HEADERS
        )
    } catch (err) {
        console.error('[get-wishes]', err?.message || err)
        return fail('server', 'The observatory is quiet right now. Please try again soon.', 500)
    }
}