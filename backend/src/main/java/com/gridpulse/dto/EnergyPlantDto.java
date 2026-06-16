package com.gridpulse.dto;

import com.gridpulse.model.EnergyPlant;

import java.time.LocalDateTime;

public class EnergyPlantDto {

    private Long id;
    private String name;
    private String type;
    private String location;
    private Double capacityMw;
    private String company;
    private String status;
    private Double latitude;
    private Double longitude;
    private LocalDateTime lastUpdated;

    public static EnergyPlantDto from(EnergyPlant plant) {
        EnergyPlantDto dto = new EnergyPlantDto();
        dto.id = plant.getId();
        dto.name = plant.getName();
        dto.type = plant.getType();
        dto.location = plant.getLocation();
        dto.capacityMw = plant.getCapacityMw();
        dto.company = plant.getCompany();
        dto.status = plant.getStatus();
        dto.latitude = plant.getLatitude();
        dto.longitude = plant.getLongitude();
        dto.lastUpdated = plant.getLastUpdated();
        return dto;
    }

    public EnergyPlant toEntity() {
        EnergyPlant plant = new EnergyPlant();
        plant.setName(name);
        plant.setType(type);
        plant.setLocation(location);
        plant.setCapacityMw(capacityMw);
        plant.setCompany(company);
        plant.setStatus(status);
        plant.setLatitude(latitude);
        plant.setLongitude(longitude);
        plant.setLastUpdated(LocalDateTime.now());
        return plant;
    }

    public void applyTo(EnergyPlant plant) {
        if (name != null) plant.setName(name);
        if (type != null) plant.setType(type);
        if (location != null) plant.setLocation(location);
        if (capacityMw != null) plant.setCapacityMw(capacityMw);
        if (company != null) plant.setCompany(company);
        if (status != null) plant.setStatus(status);
        if (latitude != null) plant.setLatitude(latitude);
        if (longitude != null) plant.setLongitude(longitude);
        plant.setLastUpdated(LocalDateTime.now());
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public Double getCapacityMw() { return capacityMw; }
    public void setCapacityMw(Double capacityMw) { this.capacityMw = capacityMw; }
    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
}