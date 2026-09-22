-- Políticas mínimas para que la app pueda leer y escribir
-- desde el cliente de Supabase (anon / publishable key).
-- Ejecutalo en SQL Editor de Supabase si ves errores de RLS.

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos_sanguineos ENABLE ROW LEVEL SECURITY;
ALTER TABLE estados_solicitud ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE donantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE donaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roles_select ON roles;
CREATE POLICY roles_select ON roles FOR SELECT USING (true);

DROP POLICY IF EXISTS grupos_select ON grupos_sanguineos;
CREATE POLICY grupos_select ON grupos_sanguineos FOR SELECT USING (true);

DROP POLICY IF EXISTS estados_select ON estados_solicitud;
CREATE POLICY estados_select ON estados_solicitud FOR SELECT USING (true);

DROP POLICY IF EXISTS usuarios_select ON usuarios;
CREATE POLICY usuarios_select ON usuarios FOR SELECT USING (true);

DROP POLICY IF EXISTS usuarios_insert ON usuarios;
CREATE POLICY usuarios_insert ON usuarios FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS usuarios_update ON usuarios;
CREATE POLICY usuarios_update ON usuarios FOR UPDATE USING (true);

DROP POLICY IF EXISTS donantes_select ON donantes;
CREATE POLICY donantes_select ON donantes FOR SELECT USING (true);

DROP POLICY IF EXISTS donantes_insert ON donantes;
CREATE POLICY donantes_insert ON donantes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS donantes_update ON donantes;
CREATE POLICY donantes_update ON donantes FOR UPDATE USING (true);

DROP POLICY IF EXISTS solicitudes_select ON solicitudes;
CREATE POLICY solicitudes_select ON solicitudes FOR SELECT USING (true);

DROP POLICY IF EXISTS solicitudes_insert ON solicitudes;
CREATE POLICY solicitudes_insert ON solicitudes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS donaciones_select ON donaciones;
CREATE POLICY donaciones_select ON donaciones FOR SELECT USING (true);

DROP POLICY IF EXISTS donaciones_insert ON donaciones;
CREATE POLICY donaciones_insert ON donaciones FOR INSERT WITH CHECK (true);

GRANT SELECT ON vista_solicitudes TO anon, authenticated;
GRANT SELECT ON roles, grupos_sanguineos, estados_solicitud TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON usuarios, donantes, solicitudes, donaciones TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
