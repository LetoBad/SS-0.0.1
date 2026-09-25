import { useEffect, useRef, useState } from 'react'
import {
  ARGENTINA_CENTER,
  geocodePlace,
  getGoogleMapsApiKey,
  loadGoogleMaps,
} from '../lib/maps.js'

function DonorsMap({ donors, requests, focusCoords }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markersRef = useRef([])
  const [status, setStatus] = useState('loading')
  const apiKey = getGoogleMapsApiKey()

  useEffect(() => {
    if (!apiKey) {
      setStatus('missing-key')
      return
    }

    let cancelled = false

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !mapRef.current) return

        if (!mapInstance.current) {
          mapInstance.current = new maps.Map(mapRef.current, {
            center: ARGENTINA_CENTER,
            zoom: 5,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          })
        }

        window.setTimeout(() => {
          if (cancelled) return
          if (mapRef.current?.querySelector('.gm-err-container')) {
            setStatus(
              'Google rechazó la API key. En Cloud Console activá facturación, Maps JavaScript API y Geocoding API, y permití http://localhost:5173/* en las restricciones de la clave.'
            )
          }
        }, 1500)

        setStatus('ready')
      })
      .catch((error) => {
        if (!cancelled) {
          setStatus(error.message)
        }
      })

    return () => {
      cancelled = true
    }
  }, [apiKey])

  useEffect(() => {
    const map = mapInstance.current
    if (!map || !window.google?.maps || status !== 'ready') return

    let cancelled = false

    async function drawMarkers() {
      markersRef.current.forEach((marker) => marker.setMap(null))
      markersRef.current = []

      const bounds = new window.google.maps.LatLngBounds()
      let hasPoints = false

      function placeMarker({ position, title, color, subtitle }) {
        const marker = new window.google.maps.Marker({
          map,
          position,
          title,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        })

        const info = new window.google.maps.InfoWindow({
          content: `<strong>${title}</strong><p style="margin:6px 0 0;color:#555">${subtitle || ''}</p>`,
        })

        marker.addListener('click', () => info.open({ map, anchor: marker }))
        markersRef.current.push(marker)
        bounds.extend(position)
        hasPoints = true
      }

      async function resolvePosition({ latitud, longitud, query }) {
        if (latitud != null && longitud != null) {
          return { lat: Number(latitud), lng: Number(longitud) }
        }
        if (!query) return null
        return geocodePlace(query)
      }

      for (const donor of donors) {
        const position = await resolvePosition({
          latitud: donor.latitud,
          longitud: donor.longitud,
          query: donor.ciudad,
        })
        if (!position || cancelled) continue
        placeMarker({
          position,
          title: `Donante disponible · ${donor.grupo || 'Grupo s/d'}`,
          subtitle: donor.ciudad || 'Ubicación GPS',
          color: '#2e7d4f',
        })
      }

      for (const request of requests) {
        const query = [request.hospital, request.ciudad].filter(Boolean).join(', ')
        const position = await resolvePosition({
          latitud: request.latitud,
          longitud: request.longitud,
          query,
        })
        if (!position || cancelled) continue
        placeMarker({
          position,
          title: `Solicitud · ${request.nombre_paciente} · ${request.grupo_sanguineo}`,
          subtitle: query,
          color: '#c62843',
        })
      }

      if (cancelled) return

      if (focusCoords?.lat != null && focusCoords?.lng != null) {
        map.panTo({ lat: Number(focusCoords.lat), lng: Number(focusCoords.lng) })
        map.setZoom(12)
        return
      }

      if (hasPoints) {
        map.fitBounds(bounds, 64)
      }
    }

    drawMarkers()

    return () => {
      cancelled = true
    }
  }, [donors, requests, focusCoords, status])

  if (status === 'missing-key') {
    return (
      <div className="map-fallback">
        <p>
          Para ver el mapa de donantes, agregá tu clave de Google Maps en
          el archivo <code>.env</code> como{' '}
          <code>VITE_GOOGLE_MAPS_API_KEY</code> y habilitá Maps JavaScript
          API y Geocoding API.
        </p>
      </div>
    )
  }

  return (
    <div className="map-wrap">
      <div ref={mapRef} className="donors-map" />
      {status !== 'ready' && status !== 'loading' ? (
        <p className="form-error">{status}</p>
      ) : null}
    </div>
  )
}

export default DonorsMap
