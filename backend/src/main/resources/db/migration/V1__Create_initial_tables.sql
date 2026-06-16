-- ============================================
-- V1__Create_initial_tables.sql
-- GridPulse - Schema iniziale
-- ============================================

-- Tabella impianti energetici
CREATE TABLE energy_plants (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    type            VARCHAR(50)  NOT NULL,
    location        VARCHAR(255) NOT NULL,
    capacity_mw     DOUBLE PRECISION,
    company         VARCHAR(255),
    status          VARCHAR(50),
    last_updated    TIMESTAMP
);

-- Tabella metriche (dati temporali)
CREATE TABLE metrics (
    id              BIGSERIAL PRIMARY KEY,
    plant_id        BIGINT NOT NULL,
    recorded_at     TIMESTAMP NOT NULL,
    power_output    DOUBLE PRECISION,
    efficiency      DOUBLE PRECISION,
    temperature     DOUBLE PRECISION,
    irradiance      DOUBLE PRECISION,
    co2_avoided     DOUBLE PRECISION,

    CONSTRAINT fk_metrics_plant
        FOREIGN KEY (plant_id)
        REFERENCES energy_plants (id)
        ON DELETE CASCADE
);

-- Indici utili per le query frequenti
CREATE INDEX idx_metrics_plant_id ON metrics (plant_id);
CREATE INDEX idx_metrics_plant_recorded_at ON metrics (plant_id, recorded_at DESC);
CREATE INDEX idx_energy_plants_type ON energy_plants (type);
CREATE INDEX idx_energy_plants_status ON energy_plants (status);
CREATE INDEX idx_energy_plants_company ON energy_plants (company);

-- Commenti per documentazione
COMMENT ON TABLE energy_plants IS 'Impianti di produzione energetica (solare ed eolico)';
COMMENT ON TABLE metrics IS 'Metriche temporali raccolte dagli impianti';
COMMENT ON COLUMN metrics.plant_id IS 'Riferimento all''impianto (FK)';
COMMENT ON COLUMN metrics.recorded_at IS 'Timestamp della rilevazione (UTC consigliato)';
COMMENT ON COLUMN metrics.efficiency IS 'Efficienza in percentuale (0-100)';
COMMENT ON COLUMN metrics.irradiance IS 'Per solare: W/m² | Per eolico: velocità vento m/s';