import { Component } from 'react'
import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import { PLANETS } from '../data/index.js'

// Loader bersama untuk semua tekstur foto planet, Bumi, dan Bulan.
// Pengaturan dipasang sekali saat tekstur selesai dimuat, sebelum frame pertama,
// jadi tidak perlu needsUpdate (yang membuat upload GPU dua kali).
// Komponen WAJIB memakai class ini di useLoader agar cache-nya sama dengan preload.
export class PlanetTextureLoader extends THREE.TextureLoader {
    load(url, onLoad, onProgress, onError) {
        return super.load(
            url,
            (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace
                tex.anisotropy = 4
                tex.wrapS = THREE.RepeatWrapping
                tex.wrapT = THREE.ClampToEdgeWrapping
                if (onLoad) onLoad(tex)
            },
            onProgress,
            onError
        )
    }
}

// Tangkap error tekstur (file hilang / gagal decode) supaya Canvas tidak kosong.
export class TextureBoundary extends Component {
    state = { failed: false }
    static getDerivedStateFromError() { return { failed: true } }
    componentDidCatch(err) { console.warn('Texture failed to load:', err) }
    render() {
        return this.state.failed ? (this.props.fallback ?? null) : this.props.children
    }
}

const STEP_MS = 900 // jeda antar unduhan, supaya tidak berebut bandwidth dengan Intro

// Unduh tekstur planet satu per satu di latar. Mengembalikan fungsi pembatal.
// Dilewati bila Data Saver aktif atau koneksi 2G; tekstur lalu dimuat saat dibutuhkan
// (fallback bola berwarna tampil sementara).
export function preloadPlanetTextures() {
    const c = typeof navigator !== 'undefined' ? navigator.connection : null
    if (c && (c.saveData || /2g$/.test(c.effectiveType || ''))) return () => { }

    const urls = PLANETS.map((p) => p.texture).filter(Boolean)
    let i = 0
    let timer = 0
    const next = () => {
        if (i >= urls.length) return
        useLoader.preload(PlanetTextureLoader, urls[i++])
        timer = setTimeout(next, STEP_MS)
    }
    next()
    return () => clearTimeout(timer)
}