const ARGENTINA_CENTER = { lat: -34.6037, lng: -58.3816 }

let mapsPromise = null

export function getGoogleMapsApiKey() {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
}

export function loadGoogleMaps() {
  const apiKey = getGoogleMapsApiKey()
  if (!apiKey) {
    return Promise.reject(new Error('Falta VITE_GOOGLE_MAPS_API_KEY'))
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps)
  }

  if (mapsPromise) {
    return mapsPromise
  }

  mapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-maps]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google.maps))
      existing.addEventListener('error', () =>
        reject(new Error('No se pudo cargar Google Maps.'))
      )
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`
    script.async = true
    script.defer = true
    script.dataset.googleMaps = 'true'
    window.gm_authFailure = () => {
      reject(
        new Error(
          'Google rechazó la API key. En Cloud Console activá facturación, Maps JavaScript API y Geocoding API, y permití http://localhost:5173/* en las restricciones de la clave.'
        )
      )
    }
    script.onload = () => resolve(window.google.maps)
    script.onerror = () =>
      reject(new Error('No se pudo cargar Google Maps. Revisá la API key.'))
    document.head.appendChild(script)
  })

  return mapsPromise
}

const geocodeCache = new Map()

export async function geocodePlace(query, countryCode) {
  const results = await searchPlaces(query, countryCode)
  return results[0] || null
}

export async function searchPlaces(query, countryCode) {
  if (!query) return []

  const cacheKey = `${countryCode || 'WW'}:${query.trim().toLowerCase()}`
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)
  }

  const maps = await loadGoogleMaps()
  const geocoder = new maps.Geocoder()

  const results = await new Promise((resolve) => {
    const request = {
      address: query,
    }

    if (countryCode) {
      request.componentRestrictions = { country: countryCode }
      request.region = countryCode
    }

    geocoder.geocode(request, (items, status) => {
      if (status !== 'OK' || !items?.length) {
        resolve([])
        return
      }

      resolve(
        items.map((item) => ({
          label: item.formatted_address,
          lat: item.geometry.location.lat(),
          lng: item.geometry.location.lng(),
        }))
      )
    })
  })

  geocodeCache.set(cacheKey, results)
  return results
}

export { ARGENTINA_CENTER }
