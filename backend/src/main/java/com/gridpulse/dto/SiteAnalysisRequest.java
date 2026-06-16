package com.gridpulse.dto;

public class SiteAnalysisRequest {
    private Double latitude;
    private Double longitude;

    // Optional date range for historical analysis (format: YYYY-MM-DD)
    private String startDate;
    private String endDate;

    public SiteAnalysisRequest() {}

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }
}
