-- ============================================================
-- SANGRESOLIDARIA — GEOLOCALIZACIÓN Y ALERTAS
-- Ejecutá ESTE script en el SQL Editor de Supabase.
-- NO borra tablas existentes. Solo agrega columnas e índices.
-- ============================================================

ALTER TABLE donantes
    ADD COLUMN IF NOT EXISTS latitud DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitud DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS radio_km NUMERIC(6,2) NOT NULL DEFAULT 5;

ALTER TABLE donantes
    DROP CONSTRAINT IF EXISTS chk_radio_km;

ALTER TABLE donantes
    ADD CONSTRAINT chk_radio_km CHECK (radio_km > 0);

ALTER TABLE solicitudes
    ADD COLUMN IF NOT EXISTS latitud DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitud DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS idx_donantes_coords
    ON donantes (latitud, longitud)
    WHERE latitud IS NOT NULL AND longitud IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_solicitudes_coords
    ON solicitudes (latitud, longitud)
    WHERE latitud IS NOT NULL AND longitud IS NOT NULL;

DROP VIEW IF EXISTS vista_solicitudes CASCADE;

CREATE VIEW vista_solicitudes AS
SELECT
    s.id,
    s.nombre_paciente,
    gs.nombre AS grupo_sanguineo,
    es.nombre AS estado,
    s.cantidad_donantes,
    s.hospital,
    s.ciudad,
    s.latitud,
    s.longitud,
    s.fecha_necesidad,
    s.descripcion,
    s.creado_en,
    u.nombre AS solicitante
FROM solicitudes s
INNER JOIN grupos_sanguineos gs
    ON s.grupo_sanguineo_id = gs.id
INNER JOIN estados_solicitud es
    ON s.estado_id = es.id
INNER JOIN usuarios u
    ON s.usuario_id = u.id;

DROP POLICY IF EXISTS notificaciones_update ON notificaciones;
CREATE POLICY notificaciones_update ON notificaciones
    FOR UPDATE USING (true);

GRANT SELECT ON vista_solicitudes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON donantes, solicitudes, notificaciones TO anon, authenticated;

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS latitud DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitud DOUBLE PRECISION;

NOTIFY pgrst, 'reload schema';
