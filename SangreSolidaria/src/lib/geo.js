export function toRad(value) {
  return (value * Math.PI) / 180
}

export function distanceKm(from, to) {
  if (
    from?.lat == null ||
    from?.lng == null ||
    to?.lat == null ||
    to?.lng == null
  ) {
    return null
  }

  const earthRadiusKm = 6371
  const dLat = toRad(to.lat - from.lat)
  const dLng = toRad(to.lng - from.lng)
  const lat1 = toRad(from.lat)
  const lat2 = toRad(to.lat)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a))
}

export function formatKm(km) {
  if (km == null || Number.isNaN(km)) return 'Sin distancia'
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

export function requestBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Este navegador no permite geolocalización.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(
            new Error(
              'No diste permiso de ubicación. Podés habilitarlo en el navegador y volver a intentar.'
            )
          )
          return
        }
        reject(new Error('No se pudo obtener tu ubicación.'))
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    )
  })
}

export function isWithinRadius(from, to, radiusKm) {
  const km = distanceKm(from, to)
  if (km == null) return false
  return km <= Number(radiusKm)
}

export const COUNTRIES = [
  { code: 'UY', name: 'Uruguay' },
  { code: 'AR', name: 'Argentina' },
  { code: 'BR', name: 'Brasil' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'CL', name: 'Chile' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'PE', name: 'Perú' },
  { code: 'CO', name: 'Colombia' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'MX', name: 'México' },
  { code: 'ES', name: 'España' },
]
