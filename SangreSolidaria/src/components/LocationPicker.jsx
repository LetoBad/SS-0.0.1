import { useState } from 'react'
import { COUNTRIES, requestBrowserLocation } from '../lib/geo.js'
import { searchPlaces } from '../lib/maps.js'

function LocationPicker({ value, onChange }) {
  const [country, setCountry] = useState(value?.country || '')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLocate() {
    setStatus('')
    setResults([])
    setLoading(true)

    try {
      const coords = await requestBrowserLocation()
      onChange({
        ...coords,
        label: 'Ubicación actual del dispositivo',
        country,
      })
      setStatus('Ubicación del GPS obtenida.')
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(event) {
    event.preventDefault()
    setStatus('')
    setResults([])

    if (!country) {
      setStatus('Elegí un país antes de buscar, para no confundir ciudades con el mismo nombre.')
      return
    }

    if (!query.trim()) {
      setStatus('Escribí una ciudad, barrio u hospital.')
      return
    }

    setLoading(true)

    try {
      const places = await searchPlaces(query.trim(), country)
      setResults(places)
      if (!places.length) {
        setStatus('No encontramos ese lugar en el país elegido.')
      }
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSelect(place) {
    onChange({
      lat: place.lat,
      lng: place.lng,
      label: place.label,
      country,
    })
    setResults([])
    setQuery(place.label)
    setStatus('Lugar seleccionado. Guardalo para usarlo en las alertas.')
  }

  return (
    <div className="location-box">
      <p>
        Elegí el país y buscá el lugar. Así Rivera en Uruguay no se
        confunde con Rivera en Argentina. También podés usar el GPS
        si das permiso.
      </p>

      <label>
        País
        <select
          value={country}
          onChange={(event) => {
            setCountry(event.target.value)
            setResults([])
          }}
        >
          <option value="">Elegí un país</option>
          {COUNTRIES.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Buscar lugar
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              handleSearch(event)
            }
          }}
          placeholder="Ej: Rivera"
        />
      </label>

      <div className="hero-buttons">
        <button
          className="btn-primary"
          type="button"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
        <button
          className="btn-secondary"
          type="button"
          onClick={handleLocate}
          disabled={loading}
        >
          Usar mi ubicación actual
        </button>
      </div>

      {results.length > 0 ? (
        <ul className="place-results">
          {results.map((place) => (
            <li key={`${place.lat}-${place.lng}-${place.label}`}>
              <button type="button" onClick={() => handleSelect(place)}>
                {place.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {value?.lat != null && value?.lng != null ? (
        <p className="location-coords">
          {value.label ? `${value.label} · ` : ''}
          {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </p>
      ) : (
        <p className="muted">Todavía no hay un lugar seleccionado.</p>
      )}

      {status ? <p className="muted">{status}</p> : null}
    </div>
  )
}

export default LocationPicker
