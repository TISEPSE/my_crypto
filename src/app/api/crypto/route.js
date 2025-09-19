import { NextResponse } from 'next/server'

// Cache par page pour éviter de spammer l'API
let cache = new Map()
const CACHE_DURATION = 300000 // 5 minutes

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const currency = searchParams.get('vs_currency') || 'eur'
    
    const now = Date.now()
    const cacheKey = `${currency}_250_all`
    
    // Vérifier le cache
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)
      if ((now - cached.timestamp) < CACHE_DURATION) {
        return NextResponse.json(cached.data)
      }
    }
    
    
    // Toujours récupérer les 250 premières par market cap pour avoir une base cohérente
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=250&page=1&price_change_percentage=1h,24h,7d&sparkline=false&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=false`,
      {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Dashboard-App/1.0'
        }
      }
    )
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      // Si 429, utiliser les données en cache même si expirées
      if (response.status === 429 && cache.has(cacheKey)) {
        const cached = cache.get(cacheKey)
        return NextResponse.json(cached.data)
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Mettre en cache
    cache.set(cacheKey, {
      data,
      timestamp: now
    })
    
    // Nettoyer le cache (garder max 20 pages)
    if (cache.size > 20) {
      const oldestKey = cache.keys().next().value
      cache.delete(oldestKey)
    }
    
    
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Erreur API crypto:', error.message)
    
    // En cas d'erreur, utiliser n'importe quel cache disponible pour cette devise
    const fallbackKey = Array.from(cache.keys()).find(key => key.startsWith(currency))
    if (fallbackKey) {
      const cached = cache.get(fallbackKey)
      return NextResponse.json(cached.data)
    }
    
    // Sinon retourner une erreur propre
    return NextResponse.json(
      { error: 'Impossible de récupérer les données crypto' },
      { status: 503 }
    )
  }
}