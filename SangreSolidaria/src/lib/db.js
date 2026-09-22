import { supabase } from '../supabase.js'

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
  if (error) {
    throw new Error(error.message || fallback)
  }
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
    .select('id, usuario_id, grupo_sanguineo_id, disponible, ultima_donacion')
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
}) {
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
    })
    .select()
    .single()

  throwIfError(error, 'No se pudo publicar la solicitud.')
  return data
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

export async function offerDonation({ donorId, requestId, notes, date }) {
  const { data, error } = await supabase
    .from('donaciones')
    .insert({
      donante_id: donorId,
      solicitud_id: requestId,
      estado: 'registrada',
      fecha_donacion: date || null,
      observaciones: notes || null,
    })
    .select()
    .single()

  throwIfError(error, 'No se pudo registrar la donación.')

  await supabase
    .from('donantes')
    .update({
      ultima_donacion: date || null,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', donorId)

  return data
}
