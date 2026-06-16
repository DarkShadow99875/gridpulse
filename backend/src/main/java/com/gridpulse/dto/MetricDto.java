package com.gridpulse.dto;

import com.gridpulse.model.Metric;

import java.time.LocalDateTime;

public class MetricDto {

    private Long id;
    private Long plantId;
    private LocalDateTime recordedAt;
    private Double powerOutput;
    private Double efficiency;
    private Double temperature;
    private Double irradiance;
    private Double co2Avoided;

    public static MetricDto from(Metric metric) {
        MetricDto dto = new MetricDto();
        dto.id = metric.getId();
        dto.plantId = metric.getPlantId();
        dto.recordedAt = metric.getRecordedAt();
        dto.powerOutput = metric.getPowerOutput();
        dto.efficiency = metric.getEfficiency();
        dto.temperature = metric.getTemperature();
        dto.irradiance = metric.getIrradiance();
        dto.co2Avoided = metric.getCo2Avoided();
        return dto;
    }

    public Metric toEntity() {
        Metric metric = new Metric();
        metric.setPlantId(plantId);
        metric.setRecordedAt(recordedAt != null ? recordedAt : LocalDateTime.now());
        metric.setPowerOutput(powerOutput);
        metric.setEfficiency(efficiency);
        metric.setTemperature(temperature);
        metric.setIrradiance(irradiance);
        metric.setCo2Avoided(co2Avoided);
        return metric;
    }

    public void applyTo(Metric metric) {
        if (recordedAt != null) metric.setRecordedAt(recordedAt);
        if (powerOutput != null) metric.setPowerOutput(powerOutput);
        if (efficiency != null) metric.setEfficiency(efficiency);
        if (temperature != null) metric.setTemperature(temperature);
        if (irradiance != null) metric.setIrradiance(irradiance);
        if (co2Avoided != null) metric.setCo2Avoided(co2Avoided);
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