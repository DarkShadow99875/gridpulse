package com.gridpulse.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "metrics")
public class Metric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "plant_id", nullable = false)
    private Long plantId;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;

    @Column(name = "power_output")
    private Double powerOutput;

    private Double efficiency;
    private Double temperature;
    private Double irradiance;

    @Column(name = "co2_avoided")
    private Double co2Avoided;

    public Metric() {}

    public Metric(Long plantId, LocalDateTime recordedAt, Double powerOutput, Double efficiency,
                  Double temperature, Double irradiance, Double co2Avoided) {
        this.plantId = plantId;
        this.recordedAt = recordedAt;
        this.powerOutput = powerOutput;
        this.efficiency = efficiency;
        this.temperature = temperature;
        this.irradiance = irradiance;
        this.co2Avoided = co2Avoided;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPlantId() { return plantId; }
    public void setPlantId(Long plantId) { this.plantId = plantId; }
    public LocalDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(LocalDateTime recordedAt) { this.recordedAt = recordedAt; }
    public Double getPowerOutput() { return powerOutput; }
    public void setPowerOutput(Double powerOutput) { this.powerOutput = powerOutput; }
    public Double getEfficiency() { return efficiency; }
    public void setEfficiency(Double efficiency) { this.efficiency = efficiency; }
    public Double getTemperature() { return temperature; }
    public void setTemperature(Double temperature) { this.temperature = temperature; }
    public Double getIrradiance() { return irradiance; }
    public void setIrradiance(Double irradiance) { this.irradiance = irradiance; }
    public Double getCo2Avoided() { return co2Avoided; }
    public void setCo2Avoided(Double co2Avoided) { this.co2Avoided = co2Avoided; }
}
