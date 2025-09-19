import { NextResponse } from 'next/server'

// Cache pour les données détaillées des cryptos
let detailCache = new Map()
const CACHE_DURATION = 600000 // 10 minutes

export async function GET(request, { params }) {
  try {
    const { coinId } = await params
    const { searchParams } = new URL(request.url)
    const currency = searchParams.get('vs_currency') || 'eur'
    const days = searchParams.get('days') || '7'
    const type = searchParams.get('type') || 'details' // 'details' ou 'chart'
    
    const cacheKey = `${coinId}_${currency}_${days}_${type}`
    const now = Date.now()
    
    // Vérifier le cache
    if (detailCache.has(cacheKey)) {
      const cached = detailCache.get(cacheKey)
      if ((now - cached.timestamp) < CACHE_DURATION) {
        return NextResponse.json(cached.data)
      }
    }
    
    
    let url
    if (type === 'chart') {
      const interval = days <= 1 ? 'hourly' : 'daily'
      url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}&interval=${interval}`
    } else {
      url = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
    }
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 12000)
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Dashboard-App/1.0'
      }
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      // Si 429, utiliser les données en cache même si expirées
      if (response.status === 429 && detailCache.has(cacheKey)) {
        const cached = detailCache.get(cacheKey)
        return NextResponse.json(cached.data)
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Mettre en cache
    detailCache.set(cacheKey, {
      data,
      timestamp: now
    })
    
    // Nettoyer le cache (garder max 50 entrées)
    if (detailCache.size > 50) {
      const oldestKey = detailCache.keys().next().value
      detailCache.delete(oldestKey)
    }
    
    
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Erreur API détail crypto:', error.message)
    
    // En cas d'erreur, utiliser le cache si disponible
    const { coinId: errorCoinId } = await params
    const { searchParams: errorSearchParams } = new URL(request.url)
    const cacheKey = `${errorCoinId}_${errorSearchParams.get('vs_currency') || 'eur'}_${errorSearchParams.get('days') || '7'}_${errorSearchParams.get('type') || 'details'}`
    if (detailCache.has(cacheKey)) {
      const cached = detailCache.get(cacheKey)
      return NextResponse.json(cached.data)
    }
    
    return NextResponse.json(
      { error: 'Impossible de récupérer les données détaillées' },
      { status: 503 }
    )
  }
}