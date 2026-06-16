-- ============================================
-- V2__Add_latitude_longitude_to_energy_plants.sql
-- Aggiunge coordinate geografiche per l'analisi territoriale
-- ============================================

ALTER TABLE energy_plants
    ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION;

ALTER TABLE energy_plants
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Indici utili per future query spaziali
CREATE INDEX IF NOT EXISTS idx_energy_plants_latitude ON energy_plants (latitude);
CREATE INDEX IF NOT EXISTS idx_energy_plants_longitude ON energy_plants (longitude);
