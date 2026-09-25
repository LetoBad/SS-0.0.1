import { supabase } from '../supabase.js'
import { canDonateTo } from './catalog.js'
import { distanceKm, isWithinRadius } from './geo.js'

const SESSION_KEY = 'ss_session'

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

function throwIfError(error, fallback) {
  if (!error) return

  const message = error.message || fallback
  if (message.includes('schema cache') || message.includes('Could not find the')) {
    throw new Error(
      'Faltan las columnas de ubicación en Supabase. Ejecutá el archivo supabase-geo.sql en SQL Editor y después recargá el schema (NOTIFY pgrst, \'reload schema\';).'
    )
  }

  if (message.includes('uq_donante_solicitud')) {
    throw new Error('Ya ofreciste donar para esta solicitud.')
  }

  throw new Error(message)
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function createSalt() {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(16)))
}

async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return bytesToHex(new Uint8Array(digest))
}

async function makePasswordHash(password) {
  const salt = createSalt()
  const hash = await hashPassword(password, salt)
  return `${salt}$${hash}`
}

async function passwordMatches(password, storedValue) {
  if (!storedValue || !storedValue.includes('$')) {
    return false
  }

  const [salt, hash] = storedValue.split('$')
  const incoming = await hashPassword(password, salt)
  return incoming === hash
}

export async function getRoles() {
  const { data, error } = await supabase
    .from('roles')
    .select('id, nombre')
    .order('id')

  throwIfError(error, 'No se pudieron cargar los roles.')
  return data
}

export async function getBloodGroups() {
  const { data, error } = await supabase
    .from('grupos_sanguineos')
    .select('id, nombre')
    .order('id')

  throwIfError(error, 'No se pudieron cargar los grupos sanguíneos.')
  return data
}

export async function getRequestStates() {
  const { data, error } = await supabase
    .from('estados_solicitud')
    .select('id, nombre')
    .order('id')

  throwIfError(error, 'No se pudieron cargar los estados.')
  return data
}

async function findRoleId(name) {
  const { data, error } = await supabase
    .from('roles')
    .select('id, nombre')
    .eq('nombre', name)
    .single()

  throwIfError(error, `No se encontró el rol ${name}.`)
  return data.id
}

async function findBloodGroupId(name) {
  const { data, error } = await supabase
    .from('grupos_sanguineos')
    .select('id')
    .eq('nombre', name)
    .single()

  throwIfError(error, `No se encontró el grupo ${name}.`)
  return data.id
}

async function findStateId(name) {
  const { data, error } = await supabase
    .from('estados_solicitud')
    .select('id')
    .eq('nombre', name)
    .single()

  throwIfError(error, `No se encontró el estado ${name}.`)
  return data.id
}

export async function getDonorByUserId(usuarioId) {
  const { data, error } = await supabase
    .from('donantes')
    .select(
      'id, usuario_id, grupo_sanguineo_id, disponible, ultima_donacion, latitud, longitud, radio_km, grupos_sanguineos ( nombre )'
    )
    .eq('usuario_id', usuarioId)
    .maybeSingle()

  throwIfError(error, 'No se pudo consultar el perfil de donante.')
  return data
}

async function buildSessionUser(usuario) {
  const { data: role, error } = await supabase
    .from('roles')
    .select('nombre')
    .eq('id', usuario.rol_id)
    .single()

  throwIfError(error, 'No se pudo leer el rol del usuario.')

  const donor = await getDonorByUserId(usuario.id)

  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    telefono: usuario.telefono,
    ciudad: usuario.ciudad,
    rol_id: usuario.rol_id,
    rol: role.nombre,
    donante_id: donor?.id ?? null,
    grupo: donor?.grupos_sanguineos?.nombre || null,
    latitud: donor?.latitud ?? usuario.latitud ?? null,
    longitud: donor?.longitud ?? usuario.longitud ?? null,
    radio_km: donor?.radio_km != null ? Number(donor.radio_km) : 5,
    disponible: donor?.disponible ?? false,
  }
}

export async function registerUser({
  name,
  email,
  password,
  phone,
  city,
  birthDate,
  role,
  bloodType,
  latitud,
  longitud,
}) {
  if (!password || password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.')
  }

  const roleName = role === 'solicitante' ? 'SOLICITANTE' : 'DONANTE'
  const rolId = await findRoleId(roleName)
  const passwordHash = await makePasswordHash(password)

  const { data: usuario, error } = await supabase
    .from('usuarios')
    .insert({
      rol_id: rolId,
      nombre: name,
      email,
      password_hash: passwordHash,
      telefono: phone || null,
      ciudad: city || null,
      fecha_nacimiento: birthDate || null,
    })
    .select()
    .single()

  throwIfError(error, 'No se pudo crear el usuario.')

  if (roleName === 'DONANTE') {
    const grupoId = await findBloodGroupId(bloodType)
    const { error: donorError } = await supabase.from('donantes').insert({
      usuario_id: usuario.id,
      grupo_sanguineo_id: grupoId,
      disponible: true,
      latitud: latitud ?? null,
      longitud: longitud ?? null,
      radio_km: 5,
    })

    throwIfError(donorError, 'El usuario se creó, pero no el perfil de donante.')
  }

  const sessionUser = await buildSessionUser(usuario)
  saveSession(sessionUser)
  return sessionUser
}

export async function loginWithPassword(email, password) {
  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .eq('activo', true)
    .maybeSingle()

  throwIfError(error, 'No se pudo iniciar sesión.')

  if (!usuario) {
    throw new Error('No hay una cuenta con ese correo.')
  }

  if (!usuario.password_hash) {
    throw new Error(
      'Esta cuenta no tiene contraseña. Ejecutá supabase-schema.sql en Supabase y volvé a registrarte.'
    )
  }

  const valid = await passwordMatches(password, usuario.password_hash)
  if (!valid) {
    throw new Error('La contraseña es incorrecta.')
  }

  const sessionUser = await buildSessionUser(usuario)
  saveSession(sessionUser)
  return sessionUser
}

export async function createBloodRequest({
  usuarioId,
  patient,
  bloodType,
  hospital,
  city,
  donorsNeeded,
  neededDate,
  details,
  latitud,
  longitud,
}) {
  if (latitud == null || longitud == null) {
    throw new Error('La solicitud necesita una ubicación para alertar donantes cercanos.')
  }

  const grupoId = await findBloodGroupId(bloodType)
  const estadoId = await findStateId('ACTIVA')

  const { data, error } = await supabase
    .from('solicitudes')
    .insert({
      usuario_id: usuarioId,
      grupo_sanguineo_id: grupoId,
      estado_id: estadoId,
      nombre_paciente: patient,
      cantidad_donantes: Number(donorsNeeded),
      hospital,
      ciudad: city,
      fecha_necesidad: neededDate || null,
      descripcion: details || null,
      latitud,
      longitud,
    })
    .select()
    .single()

  throwIfError(error, 'No se pudo publicar la solicitud.')

  const alerted = await notifyEligibleDonors({
    request: data,
    bloodType,
    hospital,
    city,
  })

  return { request: data, alerted }
}

export async function listActiveRequests() {
  const { data, error } = await supabase
    .from('vista_solicitudes')
    .select('*')
    .eq('estado', 'ACTIVA')
    .order('creado_en', { ascending: false })

  throwIfError(error, 'No se pudieron cargar las solicitudes.')
  return data
}

export async function listAvailableDonors() {
  const { data, error } = await supabase
    .from('donantes')
    .select(
      `
      id,
      disponible,
      latitud,
      longitud,
      radio_km,
      grupos_sanguineos ( nombre ),
      usuarios ( id, nombre, ciudad, activo )
    `
    )
    .eq('disponible', true)

  throwIfError(error, 'No se pudieron cargar los donantes disponibles.')

  return (data || []).map((donor) => ({
    id: donor.id,
    grupo: donor.grupos_sanguineos?.nombre || '',
    nombre: donor.usuarios?.nombre || 'Donante',
    ciudad: donor.usuarios?.ciudad || '',
    latitud: donor.latitud,
    longitud: donor.longitud,
    radio_km: donor.radio_km != null ? Number(donor.radio_km) : 5,
    activo: donor.usuarios?.activo !== false,
    usuario_id: donor.usuarios?.id,
  }))
}

async function notifyEligibleDonors({ request, bloodType, hospital, city }) {
  const donors = await listAvailableDonors()
  const requestPoint = { lat: Number(request.latitud), lng: Number(request.longitud) }
  let alerted = 0

  for (const donor of donors) {
    if (!donor.activo || !donor.usuario_id) continue
    if (!canDonateTo(donor.grupo, bloodType)) continue
    if (donor.latitud == null || donor.longitud == null) continue

    const donorPoint = { lat: Number(donor.latitud), lng: Number(donor.longitud) }
    const km = distanceKm(donorPoint, requestPoint)
    if (!isWithinRadius(donorPoint, requestPoint, donor.radio_km)) continue

    const { error } = await supabase.from('notificaciones').insert({
      usuario_id: donor.usuario_id,
      titulo: 'Solicitud cercana compatible',
      mensaje: `Hay un pedido de ${bloodType} a ${km.toFixed(1)} km (${hospital}, ${city}). Está dentro de tu radio de ${donor.radio_km} km.`,
      tipo: 'alerta_proximidad',
      solicitud_id: request.id,
    })

    if (!error) {
      alerted += 1
    }
  }

  return alerted
}

export async function saveDonorLocation({
  donorId,
  userId,
  latitud,
  longitud,
  radioKm,
  ciudad,
}) {
  const { error } = await supabase
    .from('donantes')
    .update({
      latitud,
      longitud,
      radio_km: Number(radioKm),
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', donorId)

  throwIfError(error, 'No se pudo guardar tu ubicación.')

  if (userId && ciudad) {
    await supabase
      .from('usuarios')
      .update({
        ciudad,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', userId)
  }
}

export async function completeUserProfile({
  userId,
  donorId,
  phone,
  city,
  latitud,
  longitud,
  radioKm,
}) {
  if (latitud == null || longitud == null) {
    throw new Error('Elegí país y localidad para continuar.')
  }

  let { error } = await supabase
    .from('usuarios')
    .update({
      telefono: phone || null,
      ciudad: city || null,
      latitud,
      longitud,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error && (error.message.includes('schema cache') || error.message.includes('latitud'))) {
    const retry = await supabase
      .from('usuarios')
      .update({
        telefono: phone || null,
        ciudad: city || null,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', userId)
    error = retry.error
  }

  throwIfError(error, 'No se pudieron guardar tus datos.')

  if (donorId) {
    await saveDonorLocation({
      donorId,
      userId,
      latitud,
      longitud,
      radioKm: radioKm || 5,
      ciudad,
    })
  }

  const sessionUser = await refreshSessionUser(userId)
  const withCoords = {
    ...sessionUser,
    telefono: phone || sessionUser.telefono,
    ciudad: city || sessionUser.ciudad,
    latitud: latitud ?? sessionUser.latitud,
    longitud: longitud ?? sessionUser.longitud,
    radio_km: radioKm ? Number(radioKm) : sessionUser.radio_km,
  }
  saveSession(withCoords)
  return withCoords
}

export async function listDonorAlerts(usuarioId) {
  const { data, error } = await supabase
    .from('notificaciones')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('creado_en', { ascending: false })

  throwIfError(error, 'No se pudieron cargar las alertas.')
  return data || []
}

export async function markAlertRead(id) {
  const { error } = await supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('id', id)

  throwIfError(error, 'No se pudo marcar la alerta como leída.')
}

export async function refreshSessionUser(userId) {
  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', userId)
    .single()

  throwIfError(error, 'No se pudo actualizar la sesión.')
  const sessionUser = await buildSessionUser(usuario)
  saveSession(sessionUser)
  return sessionUser
}

export async function offerDonation({ donorId, requestId, notes, date }) {
  const payload = {
    donante_id: donorId,
    solicitud_id: requestId,
    estado: 'registrada',
    fecha_donacion: date || null,
    observaciones: notes || null,
    actualizado_en: new Date().toISOString(),
  }

  const { data: existing, error: lookupError } = await supabase
    .from('donaciones')
    .select('id')
    .eq('donante_id', donorId)
    .eq('solicitud_id', requestId)
    .maybeSingle()

  throwIfError(lookupError, 'No se pudo consultar la donación.')

  let data
  if (existing) {
    const { data: updated, error } = await supabase
      .from('donaciones')
      .update({
        fecha_donacion: payload.fecha_donacion,
        observaciones: payload.observaciones,
        actualizado_en: payload.actualizado_en,
      })
      .eq('id', existing.id)
      .select()
      .single()

    throwIfError(error, 'No se pudo actualizar la donación.')
    data = { ...updated, alreadyOffered: true }
  } else {
    const { data: created, error } = await supabase
      .from('donaciones')
      .insert(payload)
      .select()
      .single()

    throwIfError(error, 'No se pudo registrar la donación.')
    data = created
  }

  await supabase
    .from('donantes')
    .update({
      ultima_donacion: date || null,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', donorId)

  return data
}
