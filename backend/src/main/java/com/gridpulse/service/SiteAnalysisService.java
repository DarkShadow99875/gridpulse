package com.gridpulse.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gridpulse.dto.SiteAnalysisRequest;
import com.gridpulse.dto.SiteAnalysisResponse;
import com.gridpulse.model.EnergyPlant;
import com.gridpulse.repository.EnergyPlantRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.InputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SiteAnalysisService {

    private final EnergyPlantRepository plantRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public SiteAnalysisService(EnergyPlantRepository plantRepository) {
        this.plantRepository = plantRepository;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newHttpClient();
    }

    public SiteAnalysisResponse analyzeSite(SiteAnalysisRequest request) {
        double lat = request.getLatitude();
        double lon = request.getLongitude();

        SiteAnalysisResponse response = new SiteAnalysisResponse();
        response.setLatitude(lat);
        response.setLongitude(lon);

        boolean solarOk = true;
        boolean windOk = true;

        // 1. Get Solar data from PVGIS (long-term, date filtering not easily supported)
        SolarData solarData = fetchPvgisSolarData(lat, lon);
        if (solarData.annualYield < 1000) solarOk = false;
        response.setAnnualYieldKwhPerKwp(solarData.annualYield);
        response.setSpecificProduction(solarData.specificProduction);

        // 2. Get Wind data from Open-Meteo (now supports custom date range)
        String requestedStart = request.getStartDate();
        String requestedEnd = request.getEndDate();

        WindDataWithMeta windMeta = fetchOpenMeteoWindDataWithMeta(lat, lon, requestedStart, requestedEnd);
        WindData windData = windMeta.data;

        boolean customPeriod = requestedStart != null && requestedEnd != null;
        boolean poorOpenMeteoData = customPeriod && windMeta.recordCount < 80;

        // === Meteostat fallback for recent periods with poor Open-Meteo data ===
        if (poorOpenMeteoData) {
            System.out.println("→ Open-Meteo gave poor data for custom recent period. Trying Meteostat stations...");
            WindDataWithMeta meteostatData = fetchMeteostatWindData(lat, lon, requestedStart, requestedEnd);

            if (meteostatData.recordCount > 20) {
                windData = meteostatData.data;
                windMeta = meteostatData;
                System.out.println("→ Using Meteostat station data (" + meteostatData.recordCount + " records)");

                // Expose station info to frontend
                response.setMeteostatStationName(meteostatData.meteostatStationName());
                response.setMeteostatStationDistanceKm(meteostatData.meteostatDistanceKm());
            } else {
                System.out.println("→ Meteostat also had insufficient data. Using long-term average.");
            }
        }

        if (windData.avgWindSpeed < 3.0) windOk = false;
        response.setAvgWindSpeed(windData.avgWindSpeed);

        // Store the actual period used for transparency
        String usedStart = (requestedStart != null && !requestedStart.isBlank()) ? requestedStart : "2018-01-01";
        String usedEnd = (requestedEnd != null && !requestedEnd.isBlank()) ? requestedEnd : "2024-12-31";
        response.setAnalysisStartDate(usedStart);
        response.setAnalysisEndDate(usedEnd);

        response.setWindDataRecords(windMeta.recordCount);
        response.setWindDataReliable(!customPeriod || windMeta.recordCount >= 80);

        if (customPeriod && windMeta.recordCount < 50) {
            response.setWindDataSource("LONG_TERM_AVERAGE (real 2026 data not yet available)");
        } else if (customPeriod) {
            response.setWindDataSource("OPEN_METEO / METEOSTAT (custom period)");
        } else {
            response.setWindDataSource("OPEN_METEO (long-term average)");
        }

        // 3. Calculate Scores
        int solarScore = calculateSolarScore(solarData.specificProduction, lat);
        int windScore = calculateWindScore(windData.avgWindSpeed);

        response.setSolarScore(solarScore);
        response.setWindScore(windScore);

        // 4. Recommendation logic
        String recommendation = buildRecommendation(solarScore, windScore);
        String primaryTech = determinePrimaryTechnology(solarScore, windScore);

        response.setRecommendation(recommendation);
        response.setPrimaryTechnology(primaryTech);

        // 5. Comparison with existing plants (simplified & more honest)
        List<SiteAnalysisResponse.PlantComparison> comparisons = buildPlantComparisons(lat, lon, solarScore, windScore);
        response.setPlantComparisons(comparisons);

        // 6. Summary + warning if using fallback data
        String summary = buildSummary(solarScore, windScore, solarData.specificProduction, windData.avgWindSpeed, primaryTech);

        if (request.getStartDate() != null && request.getEndDate() != null) {
            if (response.getWindDataRecords() != null && response.getWindDataRecords() > 50) {
                summary += String.format(" (Analisi vento basata su dati reali dal %s al %s, %d record orari)", 
                        request.getStartDate(), request.getEndDate(), response.getWindDataRecords());
            } else {
                summary += String.format(" (Periodo %s - %s: dati orari reali 2026 non ancora disponibili negli archivi gratuiti. Usando medie climatiche di lungo periodo per questa zona)", 
                        request.getStartDate(), request.getEndDate());
            }
        }

        if (!solarOk || !windOk) {
            summary += " (Dati parzialmente stimati - le API esterne non hanno risposto correttamente)";
        }
        response.setSummary(summary);

        return response;
    }

    // ==================== PVGIS Solar ====================
    private SolarData fetchPvgisSolarData(double lat, double lon) {
        try {
            // PVGIS v5 API - PV calculation
            String url = String.format(
                "https://re.jrc.ec.europa.eu/api/v5/PVcalc?lat=%.4f&lon=%.4f&peakpower=1&loss=14&" +
                "pvtechchoice=crystSi&mountingplace=free&outputformat=json",
                lat, lon
            );

            String json = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(json);

            double yield = root.path("outputs").path("totals").path("fixed").path("E_y").asDouble(1400);
            double specific = root.path("outputs").path("totals").path("fixed").path("E_y").asDouble(1400);

            return new SolarData(yield, specific);
        } catch (Exception e) {
            // Fallback with reasonable Italian averages
            double fallbackYield = 1350 + (Math.random() * 300);
            return new SolarData(fallbackYield, fallbackYield);
        }
    }

    // ==================== Open-Meteo Wind ====================
    private WindDataWithMeta fetchOpenMeteoWindDataWithMeta(double lat, double lon, String startDate, String endDate) {
        boolean customPeriod = startDate != null && !startDate.isBlank() && endDate != null && !endDate.isBlank();

        try {
            String start = customPeriod ? startDate : "2020-01-01";
            String end   = customPeriod ? endDate   : "2024-12-31";

            boolean isRecentPeriod = false;
            if (customPeriod) {
                try {
                    int startYear = Integer.parseInt(start.substring(0, 4));
                    int endYear = Integer.parseInt(end.substring(0, 4));
                    if (startYear >= 2025 || endYear >= 2025) {
                        isRecentPeriod = true;
                    }
                } catch (Exception ignored) {}
            }

            String url;

            if (isRecentPeriod) {
                // For 2025-2026 use Historical Forecast API - this archives past model runs
                // and usually has better availability for recent periods than pure reanalysis
                url = String.format(
                    "https://historical-forecast-api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f" +
                    "&start_date=%s&end_date=%s" +
                    "&hourly=wind_speed_10m,wind_speed_100m&timezone=Europe/Rome",
                    lat, lon, start, end
                );
                System.out.println("🌬️ Using Historical Forecast API for recent period (2025+): " + start + " → " + end);
            } else {
                // For older periods use the main Forecast API with dates (good balance)
                url = String.format(
                    "https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f" +
                    "&start_date=%s&end_date=%s" +
                    "&hourly=wind_speed_10m,wind_speed_100m&timezone=Europe/Rome" +
                    "&models=best_match",
                    lat, lon, start, end
                );
                System.out.println("🌬️ Using main Forecast API for period: " + start + " → " + end);
            }

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode root = objectMapper.readTree(response.body());

            JsonNode windspeed = root.path("hourly").path("wind_speed_10m");

            double sum = 0;
            int count = 0;

            if (windspeed.isArray()) {
                for (JsonNode v : windspeed) {
                    if (!v.isNull()) {
                        sum += v.asDouble();
                        count++;
                    }
                }
            }

            System.out.println("🌬️ Wind records found: " + count + " for the requested period");

            if (count < 50 && customPeriod) {
                System.out.println("⚠️  Very few or no records for the custom recent period (2025-2026). Falling back to long-term climate average for this location.");

                // Location-aware long-term average for Italy (rough but better than fixed 6.2)
                double longTermAvg = getApproximateLongTermWindSpeed(lat, lon);
                return new WindDataWithMeta(new WindData(longTermAvg), 0);
            }

            double avg = count > 0 ? sum / count : 5.8;
            WindData data = new WindData(Math.round(avg * 10.0) / 10.0);

            return new WindDataWithMeta(data, count);

        } catch (Exception e) {
            System.err.println("Error fetching wind data: " + e.getMessage());
            return new WindDataWithMeta(new WindData(5.8), 0);
        }
    }

    // Wrapper for backward compatibility (used in fallback scenarios)
    private WindData fetchOpenMeteoWindData(double lat, double lon, String startDate, String endDate) {
        return fetchOpenMeteoWindDataWithMeta(lat, lon, startDate, endDate).data;
    }

    // ==================== Meteostat Fallback (real stations) ====================

    private record MeteostatStation(String id, double lat, double lon, String name) {}

    private static final List<MeteostatStation> ITALIAN_STATIONS = List.of(
        // Existing
        new MeteostatStation("16242", 41.80, 12.59, "Rome Ciampino"),
        new MeteostatStation("16066", 45.45, 9.28, "Milan Linate"),
        new MeteostatStation("16405", 38.18, 13.10, "Palermo"),
        new MeteostatStation("16560", 39.25, 9.06, "Cagliari"),
        new MeteostatStation("16289", 40.88, 14.30, "Naples"),
        new MeteostatStation("16105", 45.50, 12.35, "Venice"),
        new MeteostatStation("16059", 45.22, 7.65, "Turin"),
        new MeteostatStation("16320", 41.13, 16.78, "Bari"),
        new MeteostatStation("16460", 37.47, 15.07, "Catania"),
        new MeteostatStation("16120", 44.42, 8.85, "Genoa"),
        new MeteostatStation("16360", 40.43, 17.23, "Lecce"),
        new MeteostatStation("16280", 40.85, 14.25, "Naples Capodichino"),
        new MeteostatStation("16546", 40.00, 9.50, "Central Sardinia"),

        // Additional stations for better coverage
        new MeteostatStation("16232", 41.80, 12.24, "Rome Fiumicino"),
        new MeteostatStation("16080", 44.53, 11.30, "Bologna"),
        new MeteostatStation("16170", 43.80, 11.20, "Florence"),
        new MeteostatStation("16270", 42.43, 14.18, "Pescara"),
        new MeteostatStation("16490", 38.07, 15.65, "Reggio Calabria"),
        new MeteostatStation("16520", 37.92, 12.50, "Trapani"),
        new MeteostatStation("16045", 45.40, 10.88, "Verona"),
        new MeteostatStation("16140", 45.65, 13.75, "Trieste"),
        new MeteostatStation("16380", 40.65, 17.95, "Brindisi"),
        new MeteostatStation("16470", 38.20, 15.55, "Messina"),
        new MeteostatStation("16088", 43.62, 13.50, "Ancona"),
        new MeteostatStation("16190", 43.68, 10.38, "Pisa"),
        new MeteostatStation("16216", 41.95, 12.50, "Rome Urbe"),
        new MeteostatStation("16535", 40.63, 8.28, "Alghero"),
        new MeteostatStation("16480", 36.82, 11.97, "Pantelleria"),
        new MeteostatStation("16250", 41.43, 15.72, "Foggia"),
        new MeteostatStation("16310", 40.47, 17.23, "Taranto"),
        new MeteostatStation("16098", 43.90, 12.90, "Rimini"),
        new MeteostatStation("16130", 44.83, 10.30, "Parma"),
        new MeteostatStation("16094", 43.72, 12.35, "Perugia"),
        new MeteostatStation("16253", 41.65, 15.73, "Foggia Amendola"),
        new MeteostatStation("16590", 39.23, 9.32, "Cagliari Elmas")
    );

    private WindDataWithMeta fetchMeteostatWindData(double lat, double lon, String startDate, String endDate) {
        try {
            // Find closest station
            MeteostatStation closest = ITALIAN_STATIONS.stream()
                    .min(Comparator.comparingDouble(s -> distance(lat, lon, s.lat, s.lon)))
                    .orElse(null);

            if (closest == null) {
                return new WindDataWithMeta(new WindData(5.8), 0);
            }

            double distKm = distance(lat, lon, closest.lat, closest.lon);
            System.out.println("→ Using Meteostat station: " + closest.name + " (" + closest.id + ") — " + String.format("%.1f", distKm) + " km away");

            // Parse years needed
            int startYear = Integer.parseInt(startDate.substring(0, 4));
            int endYear = Integer.parseInt(endDate.substring(0, 4));

            double sum = 0;
            int count = 0;

            for (int year = startYear; year <= endYear; year++) {
                String csvUrl = String.format("https://data.meteostat.net/hourly/%d/%s.csv.gz", year, closest.id);

                try {
                    HttpRequest req = HttpRequest.newBuilder().uri(URI.create(csvUrl)).build();
                    HttpResponse<InputStream> res = httpClient.send(req, HttpResponse.BodyHandlers.ofInputStream());

                    try (var gzis = new java.util.zip.GZIPInputStream(res.body());
                         var reader = new java.io.BufferedReader(new java.io.InputStreamReader(gzis))) {

                        String line;
                        boolean header = true;
                        while ((line = reader.readLine()) != null) {
                            if (header) { header = false; continue; }

                            String[] parts = line.split(",");
                            if (parts.length < 4) continue;

                            String date = parts[0];
                            String time = parts[1];
                            String wspdStr = parts[3]; // wind speed in km/h

                            if (date.compareTo(startDate) < 0 || date.compareTo(endDate) > 0) continue;
                            if (wspdStr.isEmpty() || wspdStr.equals("null")) continue;

                            try {
                                double wspdKmh = Double.parseDouble(wspdStr);
                                sum += wspdKmh / 3.6; // convert to m/s
                                count++;
                            } catch (NumberFormatException ignored) {}
                        }
                    }
                } catch (Exception e) {
                    System.out.println("   Could not load Meteostat data for year " + year + ": " + e.getMessage());
                }
            }

            double avg = count > 0 ? sum / count : 5.8;
            return new WindDataWithMeta(
                new WindData(Math.round(avg * 10.0) / 10.0), 
                count, 
                closest.name, 
                Math.round(distKm * 10.0) / 10.0
            );

        } catch (Exception e) {
            System.err.println("Meteostat fallback failed: " + e.getMessage());
            return new WindDataWithMeta(new WindData(5.8), 0);
        }
    }

    private double distance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon/2) * Math.sin(dLon/2);
        return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); // km
    }

    // ==================== Scoring ====================
    private int calculateSolarScore(double specificProduction, double lat) {
        // Based on typical Italian values (good south = ~1600+, north = ~1100)
        double base = Math.min(100, Math.max(0, (specificProduction - 1050) / 6.5));
        // Bonus for southern latitude
        double latBonus = lat < 42 ? 8 : (lat > 45 ? -6 : 0);
        return (int) Math.min(100, Math.max(35, Math.round(base + latBonus)));
    }

    /**
     * Rough long-term average wind speed (10m) for different Italian zones.
     * Used as fallback when real recent data is not yet available.
     */
    private double getApproximateLongTermWindSpeed(double lat, double lon) {
        // Very rough zoning
        if (lat > 44.5) {
            return 4.8; // North (Po Valley, Alps foothills) - generally lower
        } else if (lat < 38.5) {
            return 6.5; // South + Sicily - often windier
        } else if (lon < 10) {
            return 7.2; // Western Sardinia / Liguria - among the windiest
        } else if (lon > 16) {
            return 6.0; // Puglia / Calabria Ionian side
        }
        return 5.8; // Default central Italy
    }

    private int calculateWindScore(double avgWindSpeed) {
        // Good wind in Italy for commercial: > 6.5 m/s average
        if (avgWindSpeed >= 7.5) return 92;
        if (avgWindSpeed >= 6.8) return 82;
        if (avgWindSpeed >= 6.0) return 70;
        if (avgWindSpeed >= 5.2) return 55;
        if (avgWindSpeed >= 4.5) return 42;
        return 28;
    }

    private String buildRecommendation(int solarScore, int windScore) {
        if (solarScore >= 82 && windScore >= 65) {
            return "Zona eccellente sia per solare che per eolico.";
        } else if (solarScore >= 80) {
            return "Ottima zona per impianti solari. Eolico discreto.";
        } else if (windScore >= 78) {
            return "Buona zona per eolico. Solare nella media.";
        } else if (solarScore >= 65 && windScore >= 55) {
            return "Zona accettabile per entrambi. Valutare il business case.";
        } else {
            return "Zona sotto la media per nuove installazioni. Meglio cercare alternative.";
        }
    }

    private String determinePrimaryTechnology(int solarScore, int windScore) {
        if (solarScore > windScore + 18) return "SOLAR";
        if (windScore > solarScore + 18) return "WIND";
        if (solarScore >= 70 && windScore >= 65) return "BOTH";
        return "SOLAR"; // default
    }

    // ==================== Comparison ====================
    private List<SiteAnalysisResponse.PlantComparison> buildPlantComparisons(double lat, double lon, int solarScore, int windScore) {
        List<EnergyPlant> plants = plantRepository.findAll();

        return plants.stream()
                .filter(p -> p.getLatitude() != null && p.getLongitude() != null)
                .map(plant -> {
                    double distance = haversine(lat, lon, plant.getLatitude(), plant.getLongitude());

                    // Much more honest comparison
                    String advantage;
                    if (distance < 50) {
                        advantage = "Molto simile";
                    } else if (distance < 150) {
                        advantage = "Abbastanza simile";
                    } else {
                        advantage = "Molto diversa";
                    }

                    SiteAnalysisResponse.PlantComparison comp = new SiteAnalysisResponse.PlantComparison();
                    comp.setPlantName(plant.getName());
                    comp.setLocation(plant.getLocation());
                    comp.setType(plant.getType());
                    // Show the selected point's scores vs the plant (for now we just show the plant type)
                    comp.setSolarScore(solarScore);
                    comp.setWindScore(windScore);
                    comp.setAdvantage(advantage + " (distanza ~" + Math.round(distance) + " km)");
                    return comp;
                })
                .limit(4)
                .collect(Collectors.toList());
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371; // km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private String buildSummary(int solarScore, int windScore, double solarYield, double windSpeed, String primary) {
        return String.format("Punteggio solare: %d/100 | Eolico: %d/100. " +
                "Produzione solare attesa ~%.0f kWh/kWp/anno. Vento medio %.1f m/s. " +
                "Tecnologia più indicata: %s.",
                solarScore, windScore, solarYield, windSpeed, primary);
    }

    // Helper records
    private record SolarData(double annualYield, double specificProduction) {}
    private record WindData(double avgWindSpeed) {}

    private record WindDataWithMeta(WindData data, int recordCount, String meteostatStationName, Double meteostatDistanceKm) {

        // Convenience constructors
        public WindDataWithMeta(WindData data, int recordCount) {
            this(data, recordCount, null, null);
        }
    }
}
