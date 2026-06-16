package com.gridpulse.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "energy_plants")
public class EnergyPlant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String type; // SOLAR, WIND

    @Column(nullable = false)
    private String location;

    @Column(name = "capacity_mw")
    private Double capacityMw;

    private String company;

    private String status;

    private Double latitude;
    private Double longitude;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    public EnergyPlant() {}

    public EnergyPlant(String name, String type, String location, Double capacityMw, String company, String status,
                       Double latitude, Double longitude) {
        this.name = name;
        this.type = type;
        this.location = location;
        this.capacityMw = capacityMw;
        this.company = company;
        this.status = status;
        this.latitude = latitude;
        this.longitude = longitude;
        this.lastUpdated = LocalDateTime.now();
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
