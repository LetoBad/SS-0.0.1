-- Permite cerrar un pedido y marcar las ofertas como realizadas o canceladas.
-- Ejecutalo en el SQL Editor de Supabase.

DROP POLICY IF EXISTS solicitudes_update ON solicitudes;
CREATE POLICY solicitudes_update ON solicitudes
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS donaciones_update ON donaciones;
CREATE POLICY donaciones_update ON donaciones
    FOR UPDATE USING (true);

GRANT SELECT, INSERT, UPDATE ON solicitudes, donaciones TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
