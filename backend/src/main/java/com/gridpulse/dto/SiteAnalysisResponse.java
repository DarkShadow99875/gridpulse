package com.gridpulse.dto;

import java.util.List;

public class SiteAnalysisResponse {

    private Double latitude;
    private Double longitude;

    // Scores
    private Integer solarScore;      // 0-100
    private Integer windScore;       // 0-100

    // Solar data
    private Double annualYieldKwhPerKwp;   // from PVGIS
    private Double specificProduction;     // kWh/kWp

    // Wind data
    private Double avgWindSpeed;           // m/s at 10m
    private Double estimatedCapacityFactor; // %

    // Recommendation
    private String recommendation;         // "Eccellente per solare", etc.
    private String primaryTechnology;      // SOLAR, WIND, BOTH, NEITHER

    // Comparison with existing plants
    private List<PlantComparison> plantComparisons;

    private String summary;

    // Period used for the analysis (especially relevant for wind)
    private String analysisStartDate;
    private String analysisEndDate;

    // True if the custom date range had enough weather data for reliable wind average
    private Boolean windDataReliable;

    // Number of hourly records actually used for the wind average (useful for debugging custom periods)
    private Integer windDataRecords;

    // Source of the wind data: OPEN_METEO, METEOSTAT, FALLBACK
    private String windDataSource;

    // Meteostat station information (when used)
    private String meteostatStationName;
    private Double meteostatStationDistanceKm;

    // Getters and Setters

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Integer getSolarScore() { return solarScore; }
    public void setSolarScore(Integer solarScore) { this.solarScore = solarScore; }

    public Integer getWindScore() { return windScore; }
    public void setWindScore(Integer windScore) { this.windScore = windScore; }

    public Double getAnnualYieldKwhPerKwp() { return annualYieldKwhPerKwp; }
    public void setAnnualYieldKwhPerKwp(Double annualYieldKwhPerKwp) { this.annualYieldKwhPerKwp = annualYieldKwhPerKwp; }

    public Double getSpecificProduction() { return specificProduction; }
    public void setSpecificProduction(Double specificProduction) { this.specificProduction = specificProduction; }

    public Double getAvgWindSpeed() { return avgWindSpeed; }
    public void setAvgWindSpeed(Double avgWindSpeed) { this.avgWindSpeed = avgWindSpeed; }

    public Double getEstimatedCapacityFactor() { return estimatedCapacityFactor; }
    public void setEstimatedCapacityFactor(Double estimatedCapacityFactor) { this.estimatedCapacityFactor = estimatedCapacityFactor; }

    public String getRecommendation() { return recommendation; }
    public void setRecommendation(String recommendation) { this.recommendation = recommendation; }

    public String getPrimaryTechnology() { return primaryTechnology; }
    public void setPrimaryTechnology(String primaryTechnology) { this.primaryTechnology = primaryTechnology; }

    public List<PlantComparison> getPlantComparisons() { return plantComparisons; }
    public void setPlantComparisons(List<PlantComparison> plantComparisons) { this.plantComparisons = plantComparisons; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    // Inner class for comparison
    public static class PlantComparison {
        private String plantName;
        private String location;
        private String type;
        private Integer solarScore;
        private Integer windScore;
        private String advantage; // "Meglio qui", "Simile", "Peggio qui"

        public String getPlantName() { return plantName; }
        public void setPlantName(String plantName) { this.plantName = plantName; }

        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }

        public Integer getSolarScore() { return solarScore; }
        public void setSolarScore(Integer solarScore) { this.solarScore = solarScore; }

        public Integer getWindScore() { return windScore; }
        public void setWindScore(Integer windScore) { this.windScore = windScore; }

        public String getAdvantage() { return advantage; }
        public void setAdvantage(String advantage) { this.advantage = advantage; }
    }

    // Getters and Setters for analysis period
    public String getAnalysisStartDate() { return analysisStartDate; }
    public void setAnalysisStartDate(String analysisStartDate) { this.analysisStartDate = analysisStartDate; }

    public String getAnalysisEndDate() { return analysisEndDate; }
    public void setAnalysisEndDate(String analysisEndDate) { this.analysisEndDate = analysisEndDate; }

    public Boolean getWindDataReliable() { return windDataReliable; }
    public void setWindDataReliable(Boolean windDataReliable) { this.windDataReliable = windDataReliable; }

    public Integer getWindDataRecords() { return windDataRecords; }
    public void setWindDataRecords(Integer windDataRecords) { this.windDataRecords = windDataRecords; }

    public String getWindDataSource() { return windDataSource; }
    public void setWindDataSource(String windDataSource) { this.windDataSource = windDataSource; }

    public String getMeteostatStationName() { return meteostatStationName; }
    public void setMeteostatStationName(String meteostatStationName) { this.meteostatStationName = meteostatStationName; }

    public Double getMeteostatStationDistanceKm() { return meteostatStationDistanceKm; }
    public void setMeteostatStationDistanceKm(Double meteostatStationDistanceKm) { this.meteostatStationDistanceKm = meteostatStationDistanceKm; }
}
