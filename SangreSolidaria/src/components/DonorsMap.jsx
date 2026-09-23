import { useEffect, useRef, useState } from 'react'
import {
  ARGENTINA_CENTER,
  geocodePlace,
  getGoogleMapsApiKey,
  loadGoogleMaps,
} from '../lib/maps.js'

function DonorsMap({ donors, requests, focusPlace }) {
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

      async function addMarker({ query, title, color }) {
        const position = await geocodePlace(query)
        if (!position || cancelled) return

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
          content: `<strong>${title}</strong><p style="margin:6px 0 0;color:#555">${query}</p>`,
        })

        marker.addListener('click', () => info.open({ map, anchor: marker }))
        markersRef.current.push(marker)
        bounds.extend(position)
        hasPoints = true
      }

      for (const donor of donors) {
        if (!donor.ciudad) continue
        await addMarker({
          query: donor.ciudad,
          title: `Donante disponible · ${donor.grupo || 'Grupo s/d'}`,
          color: '#2e7d4f',
        })
      }

      for (const request of requests) {
        const query = [request.hospital, request.ciudad].filter(Boolean).join(', ')
        if (!query) continue
        await addMarker({
          query,
          title: `Solicitud · ${request.nombre_paciente} · ${request.grupo_sanguineo}`,
          color: '#c62843',
        })
      }

      if (cancelled) return

      if (focusPlace) {
        const focused = await geocodePlace(focusPlace)
        if (focused) {
          map.panTo(focused)
          map.setZoom(12)
          return
        }
      }

      if (hasPoints) {
        map.fitBounds(bounds, 64)
      }
    }

    drawMarkers()

    return () => {
      cancelled = true
    }
  }, [donors, requests, focusPlace, status])

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
