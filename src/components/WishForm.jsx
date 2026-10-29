import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { sfx } from '../hooks/useSfx.js'
import {
    CATEGORIES,
    MESSAGE_MAX,
    MESSAGE_MIN,
    NAME_MAX,
    getSessionCallsign,
    submitWish,
} from '../services/wishes.js'
import styles from './WishForm.module.css'

const RISE_MS = 2800
const RISE_MS_REDUCED = 1500

const RATING_WORDS = ['', 'A faint glimmer', 'Some starlight', 'A good voyage', 'A bright journey', 'Pure supernova']

const DEFAULT_DRAFT = {
    name: '',
    anonymous: false,
    category: 'wish',
    message: '',
    rating: 0,
    isPrivate: false,
    consent: false,
}

/**
 * Props:
 *  - initialDraft: isi form yang tersimpan saat form ditutup (opsional)
 *  - onClose(draft): form ditutup tanpa kirim
 *  - onSaved(record): kiriman sukses (App menyimpannya sebagai mySubmission)
 *  - onDone(): animasi bintang naik selesai, lanjut ke Secret Ending
 */
export default function WishForm({ initialDraft, onClose, onSaved, onDone }) {
    const uid = useId()
    const [draft, setDraft] = useState({ ...DEFAULT_DRAFT, ...initialDraft })
    const [hoverRating, setHoverRating] = useState(0)
    const [attempted, setAttempted] = useState(false)
    const [status, setStatus] = useState('idle') // idle | sending | rise
    const [serverError, setServerError] = useState('')
    const [honeypot, setHoneypot] = useState('')
    const [viewport, setViewport] = useState(null) // { h, top } dari visualViewport (keyboard virtual)

    const dialogRef = useRef(null)
    const closeRef = useRef(null)
    const submitRef = useRef(null)
    const messageRef = useRef(null)
    const ratingRef = useRef(null)
    const consentRef = useRef(null)
    const timerRef = useRef(0)
    const mountedRef = useRef(false)
    const draftRef = useRef(draft)
    draftRef.current = draft
    const statusRef = useRef(status)
    statusRef.current = status
    const cbRef = useRef({ onClose, onSaved, onDone })
    cbRef.current = { onClose, onSaved, onDone }

    const reduce = useRef(
        typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ).current

    const callsign = getSessionCallsign()
    const set = (patch) => setDraft((d) => ({ ...d, ...patch }))

    // ── Validasi ──
    const msgLen = draft.message.trim().length
    const errors = {}
    if (msgLen === 0) errors.message = 'Your wish needs a few words, even a tiny one.'
    else if (msgLen < MESSAGE_MIN) errors.message = `A little more, please: at least ${MESSAGE_MIN} characters.`
    if (!draft.rating) errors.rating = 'Please rate your journey. Tap a star.'
    if (!draft.isPrivate && !draft.consent) {
        errors.consent = 'Tick the box to show your message in the Gallery, or send it privately.'
    }
    const show = attempted ? errors : {}

    // ── Tutup ──
    const handleClose = () => {
        if (statusRef.current !== 'idle') return
        sfx.close()
        cbRef.current.onClose?.(draftRef.current)
    }
    const closeRefFn = useRef(handleClose)
    closeRefFn.current = handleClose

    // ── Mount: fokus ke dialog, Esc, visualViewport, cleanup ──
    useEffect(() => {
        mountedRef.current = true
        dialogRef.current?.focus({ preventScroll: true })

        const onKey = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault()
                closeRefFn.current()
            }
        }
        document.addEventListener('keydown', onKey)

        // Keyboard virtual: ikuti visual viewport agar tombol kirim tidak tertutup
        const vv = window.visualViewport
        const sync = () => setViewport({ h: vv.height, top: vv.offsetTop })
        if (vv) {
            sync()
            vv.addEventListener('resize', sync)
            vv.addEventListener('scroll', sync)
        }

        return () => {
            mountedRef.current = false
            clearTimeout(timerRef.current)
            document.removeEventListener('keydown', onKey)
            if (vv) {
                vv.removeEventListener('resize', sync)
                vv.removeEventListener('scroll', sync)
            }
        }
    }, [])

    // Fokus terjebak di dalam dialog (portal ada di akhir body)
    const onKeyDown = (e) => {
        if (e.key !== 'Tab') return
        const active = document.activeElement
        if (e.shiftKey && (active === closeRef.current || active === dialogRef.current)) {
            e.preventDefault()
            submitRef.current?.focus()
        } else if (!e.shiftKey && active === submitRef.current) {
            e.preventDefault()
            closeRef.current?.focus()
        }
    }

    // ── Submit ──
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (status !== 'idle') return
        setAttempted(true)

        if (errors.message) return messageRef.current?.focus()
        if (errors.rating) return ratingRef.current?.focus()
        if (errors.consent) return consentRef.current?.focus()

        setStatus('sending')
        setServerError('')

        const anonymous = draft.anonymous || !draft.name.trim()
        const payload = {
            displayName: anonymous ? callsign : draft.name.trim(),
            isAnonymous: anonymous,
            category: draft.category,
            message: draft.message.trim(),
            rating: draft.rating,
            isPrivate: draft.isPrivate,
            consent: draft.consent,
            website: honeypot, // honeypot: harus kosong
        }

        try {
            const record = await submitWish(payload)
            if (!mountedRef.current) return
            sfx.reveal()
            cbRef.current.onSaved?.(record)
            setStatus('rise')
            timerRef.current = setTimeout(() => cbRef.current.onDone?.(), reduce ? RISE_MS_REDUCED : RISE_MS)
        } catch (err) {
            if (!mountedRef.current) return
            setStatus('idle')
            setServerError(
                err?.code === 'validation' || err?.code === 'rate_limit'
                    ? err.message
                    : 'Your wish got lost in the dark for a moment. Please try again.'
            )
        }
    }

    const busy = status !== 'idle'
    const rising = status === 'rise'

    const overlayStyle = viewport
        ? { height: `${viewport.h}px`, top: `${viewport.top}px` }
        : undefined

    const content = (
        <div className={`${styles.overlay} ${rising ? styles.overlayRise : ''}`} style={overlayStyle}>
            <div
                ref={dialogRef}
                className={`${styles.box} ${rising ? styles.boxOut : ''}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${uid}-title`}
                aria-describedby={`${uid}-notice`}
                tabIndex={-1}
                onKeyDown={onKeyDown}
            >
                <header className={styles.header}>
                    <div>
                        <p className={styles.eyebrow}>Wishing Star</p>
                        <h3 id={`${uid}-title`} className={styles.title}>
                            Whisper <em>your wish</em>
                        </h3>
                    </div>
                    <button
                        ref={closeRef}
                        type="button"
                        className={styles.close}
                        onClick={handleClose}
                        disabled={busy}
                        aria-label="Close wish form"
                    >
                        ✕
                    </button>
                </header>

                <form className={styles.form} onSubmit={handleSubmit} noValidate>
                    <div className={styles.body}>
                        <p id={`${uid}-notice`} className={styles.notice}>
                            {draft.isPrivate
                                ? 'Only the developer will read this message. Still, please don’t share personal information.'
                                : 'Your message will be displayed in the Gallery of Astronauts for other travelers to see. Please don’t include personal information such as email, phone number or address.'}
                        </p>

                        {/* Nama + anonim */}
                        <div className={styles.field}>
                            <label htmlFor={`${uid}-name`} className={styles.label}>
                                Your name <span className={styles.opt}>optional</span>
                            </label>
                            <input
                                id={`${uid}-name`}
                                type="text"
                                className={styles.input}
                                value={draft.anonymous ? callsign : draft.name}
                                onChange={(e) => set({ name: e.target.value })}
                                disabled={draft.anonymous}
                                maxLength={NAME_MAX}
                                placeholder="How should we call you?"
                                autoComplete="off"
                            />
                            <label className={styles.switchRow}>
                                <input
                                    type="checkbox"
                                    role="switch"
                                    className={styles.hiddenInput}
                                    checked={draft.anonymous}
                                    onChange={(e) => set({ anonymous: e.target.checked })}
                                />
                                <span className={styles.switchTrack} aria-hidden="true">
                                    <span className={styles.switchThumb} />
                                </span>
                                <span>Stay anonymous</span>
                            </label>
                            <p className={styles.hintSmall}>
                                {draft.anonymous || !draft.name.trim()
                                    ? `You will fly as ${callsign}.`
                                    : 'Your name will appear on your astronaut card.'}
                            </p>
                        </div>

                        {/* Kategori */}
                        <fieldset className={styles.fieldset}>
                            <legend className={styles.label}>What is this about?</legend>
                            <div className={styles.chips}>
                                {CATEGORIES.map((c) => (
                                    <label key={c.id} className={styles.chip}>
                                        <input
                                            type="radio"
                                            name={`${uid}-cat`}
                                            value={c.id}
                                            className={styles.hiddenInput}
                                            checked={draft.category === c.id}
                                            onChange={() => set({ category: c.id })}
                                        />
                                        <span className={styles.chipText}>{c.label}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        {/* Pesan */}
                        <div className={styles.field}>
                            <label htmlFor={`${uid}-msg`} className={styles.label}>Your message</label>
                            <textarea
                                id={`${uid}-msg`}
                                ref={messageRef}
                                className={`${styles.input} ${styles.textarea} ${show.message ? styles.invalid : ''}`}
                                rows={4}
                                maxLength={MESSAGE_MAX}
                                value={draft.message}
                                onChange={(e) => set({ message: e.target.value })}
                                placeholder="Write a wish, or tell us what you thought."
                                aria-invalid={Boolean(show.message)}
                                aria-describedby={`${uid}-count${show.message ? ` ${uid}-msg-err` : ''}`}
                            />
                            <div className={styles.metaRow}>
                                <span
                                    id={`${uid}-count`}
                                    className={`${styles.counter} ${draft.message.length >= MESSAGE_MAX - 20 ? styles.counterNear : ''}`}
                                >
                                    {draft.message.length}/{MESSAGE_MAX}
                                </span>
                            </div>
                            {show.message && <p id={`${uid}-msg-err`} className={styles.error}>{show.message}</p>}
                        </div>

                        {/* Rating */}
                        <fieldset
                            ref={ratingRef}
                            tabIndex={-1}
                            className={styles.fieldset}
                            aria-describedby={show.rating ? `${uid}-rate-err` : undefined}
                        >
                            <legend className={styles.label}>How was your journey?</legend>
                            <div className={styles.stars} onPointerLeave={() => setHoverRating(0)}>
                                {[1, 2, 3, 4, 5].map((n) => {
                                    const on = n <= (hoverRating || draft.rating)
                                    return (
                                        <label
                                            key={n}
                                            className={`${styles.star} ${on ? styles.starOn : ''}`}
                                            onPointerEnter={(e) => e.pointerType === 'mouse' && setHoverRating(n)}
                                        >
                                            <input
                                                type="radio"
                                                name={`${uid}-rating`}
                                                value={n}
                                                className={styles.hiddenInput}
                                                checked={draft.rating === n}
                                                onChange={() => {
                                                    set({ rating: n })
                                                    sfx.chime(n)
                                                }}
                                            />
                                            <span aria-hidden="true">★</span>
                                            <span className={styles.srOnly}>{n} {n === 1 ? 'star' : 'stars'}</span>
                                        </label>
                                    )
                                })}
                                <span className={styles.ratingWord} aria-hidden="true">
                                    {RATING_WORDS[hoverRating || draft.rating]}
                                </span>
                            </div>
                            {show.rating && <p id={`${uid}-rate-err`} className={styles.error}>{show.rating}</p>}
                        </fieldset>

                        {/* Private */}
                        <label className={styles.check}>
                            <input
                                type="checkbox"
                                className={styles.hiddenInput}
                                checked={draft.isPrivate}
                                onChange={(e) => set({ isPrivate: e.target.checked })}
                            />
                            <span className={styles.checkBox} aria-hidden="true">✓</span>
                            <span>
                                Send privately to the developer
                                <small className={styles.checkSmall}>It won’t appear in the Gallery.</small>
                            </span>
                        </label>

                        {/* Persetujuan tampil publik (tidak perlu untuk mode private) */}
                        {!draft.isPrivate && (
                            <div className={styles.field}>
                                <label className={styles.check}>
                                    <input
                                        ref={consentRef}
                                        type="checkbox"
                                        className={styles.hiddenInput}
                                        checked={draft.consent}
                                        onChange={(e) => set({ consent: e.target.checked })}
                                        aria-invalid={Boolean(show.consent)}
                                        aria-describedby={show.consent ? `${uid}-consent-err` : undefined}
                                    />
                                    <span className={`${styles.checkBox} ${show.consent ? styles.checkBoxInvalid : ''}`} aria-hidden="true">✓</span>
                                    <span>I agree that my message may be shown publicly in the Gallery of Astronauts.</span>
                                </label>
                                {show.consent && <p id={`${uid}-consent-err`} className={styles.error}>{show.consent}</p>}
                            </div>
                        )}

                        {/* Honeypot (disiapkan untuk fase backend): manusia tidak melihatnya */}
                        <div className={styles.hp} aria-hidden="true">
                            <label>
                                Website
                                <input
                                    type="text"
                                    name="website"
                                    tabIndex={-1}
                                    autoComplete="off"
                                    value={honeypot}
                                    onChange={(e) => setHoneypot(e.target.value)}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Footer selalu terlihat (di luar area scroll) */}
                    <div className={styles.footer}>
                        {serverError && <p role="alert" className={`${styles.error} ${styles.serverError}`}>{serverError}</p>}
                        <button ref={submitRef} type="submit" className={styles.submit} disabled={status === 'sending'} aria-busy={status === 'sending'}>
                            {status === 'sending' ? 'Sending to the stars…' : draft.isPrivate ? 'Send privately ✦' : 'Send my wish ✦'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Bintang permintaan naik */}
            {rising && (
                <div className={styles.rise} aria-hidden="true">
                    <span className={styles.riseStar}>✦</span>
                    <p className={styles.riseText}>Your wish is rising to the stars…</p>
                </div>
            )}
            <div role="status" className={styles.srOnly}>
                {rising ? 'Your wish is rising to the stars.' : ''}
            </div>
        </div>
    )

    return createPortal(content, document.body)
}