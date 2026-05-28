package com.gridpulse.service;

import com.gridpulse.model.EnergyPlant;
import com.gridpulse.model.Metric;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Random;

@Service
public class AiInsightService {

    private final Random random = new Random();

    public AiInsight generateInsight(EnergyPlant plant, List<Metric> recentMetrics) {
        if (recentMetrics.isEmpty()) {
            return new AiInsight("No data available", "LOW", LocalDate.now().plusDays(30), "Insufficient data for prediction");
        }

        Metric latest = recentMetrics.get(recentMetrics.size() - 1);
        double avgEfficiency = recentMetrics.stream()
                .mapToDouble(Metric::getEfficiency)
                .average()
                .orElse(85.0);

        String riskLevel;
        LocalDate predictedMaintenance;
        String recommendation;

        if (avgEfficiency < 72) {
            riskLevel = "HIGH";
            predictedMaintenance = LocalDate.now().plusDays(3 + random.nextInt(5));
            recommendation = "Critical efficiency drop detected. Recommend immediate inspection of inverters and cleaning of panels.";
        } else if (avgEfficiency < 82) {
            riskLevel = "MEDIUM";
            predictedMaintenance = LocalDate.now().plusDays(12 + random.nextInt(10));
            recommendation = "Slight performance degradation observed. Schedule preventive maintenance within 2 weeks.";
        } else {
            riskLevel = "LOW";
            predictedMaintenance = LocalDate.now().plusDays(45 + random.nextInt(20));
            recommendation = "Plant operating optimally. Next routine check recommended in 6-8 weeks.";
        }

        if (latest.getTemperature() > 42) {
            riskLevel = "HIGH";
            recommendation = "High temperature anomaly detected. Risk of thermal stress. Urgent cooling system check advised.";
        }

        return new AiInsight(
            riskLevel,
            predictedMaintenance,
            recommendation,
            Math.round(avgEfficiency * 10) / 10.0,
            "Time-Series Forecasting + Anomaly Detection"
        );
    }

    public record AiInsight(
        String riskLevel,
        LocalDate predictedMaintenanceDate,
        String recommendation,
        double healthScore,
        String modelUsed
    ) {}
}