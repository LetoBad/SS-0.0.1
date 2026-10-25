import { useEffect, useRef, useState } from 'react'
import { COUNTRIES } from '../lib/geo.js'
import { searchPlaces } from '../lib/maps.js'

function LocationPicker({
  value,
  onChange,
  showCurrentLocation = false,
  presetCountry = false,
  countryPending = false,
}) {
  const [country, setCountry] = useState(value?.country || '')
  const [query, setQuery] = useState(value?.label || '')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const skipNextSearch = useRef(false)
  const queryUntouched = useRef(true)

  useEffect(() => {
    if (value?.country && value.country !== country) {
      setCountry(value.country)
    }
  }, [value?.country, country])

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false
      return
    }

    const term = query.trim()
    const savedLabel = (value?.label || '').trim()
    if (
      queryUntouched.current &&
      value?.lat != null &&
      term &&
      term === savedLabel
    ) {
      setResults([])
      return
    }

    if (!country || term.length < 3) {
      setResults([])
      return
    }

    const timer = window.setTimeout(async () => {
      setLoading(true)
      setStatus('')
      try {
        const places = await searchPlaces(term, country)
        setResults(places)
        if (!places.length) {
          setStatus('No encontramos ese lugar en el país elegido.')
        }
      } catch (error) {
        setResults([])
        setStatus(error.message)
      } finally {
        setLoading(false)
      }
    }, 350)

    return () => window.clearTimeout(timer)
  }, [query, country, value?.label, value?.lat])

  function handleSelect(place) {
    skipNextSearch.current = true
    onChange({
      lat: place.lat,
      lng: place.lng,
      label: place.label,
      country,
    })
    setResults([])
    setQuery(place.label)
    setStatus('Lugar seleccionado.')
  }

  function handleCountryChange(event) {
    const nextCountry = event.target.value
    setCountry(nextCountry)
    setResults([])
    onChange({
      lat: value?.lat ?? null,
      lng: value?.lng ?? null,
      label: value?.label || query,
      country: nextCountry,
    })
  }

  const knownCountry = COUNTRIES.some((item) => item.code === country)
  const countryOptions =
    country && !knownCountry
      ? [{ code: country, name: country }, ...COUNTRIES]
      : COUNTRIES

  return (
    <div className="location-box">
      <p>
        {presetCountry
          ? 'Este es el país de tu cuenta. Podés cambiarlo y actualizar la localidad.'
          : 'Elegí el país y escribí tu localidad. Van a aparecer sugerencias para que elijas el lugar correcto.'}
      </p>

      {presetCountry && !country && countryPending ? (
        <p className="muted">Cargando el país de tu cuenta...</p>
      ) : (
        <label>
          País
          <select value={country} onChange={handleCountryChange}>
            {presetCountry ? null : <option value="">Elegí un país</option>}
            {presetCountry && !country ? (
              <option value="">País de la cuenta</option>
            ) : null}
            {countryOptions.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label>
        Localidad
        <input
          type="search"
          value={query}
          onChange={(event) => {
            queryUntouched.current = false
            setQuery(event.target.value)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
            }
          }}
          placeholder="Ej: Rivera"
          autoComplete="off"
        />
      </label>

      {loading ? <p className="muted">Buscando sugerencias...</p> : null}

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

      {showCurrentLocation ? (
        <button className="btn-secondary" type="button" disabled>
          Usar mi ubicación actual
        </button>
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
