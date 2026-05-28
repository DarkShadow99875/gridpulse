package com.gridpulse.controller;

import com.gridpulse.model.EnergyPlant;
import com.gridpulse.model.Metric;
import com.gridpulse.repository.EnergyPlantRepository;
import com.gridpulse.repository.MetricRepository;
import com.gridpulse.service.AiInsightService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "http://localhost:5173")
public class AiController {

    private final AiInsightService aiInsightService;
    private final EnergyPlantRepository plantRepository;
    private final MetricRepository metricRepository;

    public AiController(AiInsightService aiInsightService,
                        EnergyPlantRepository plantRepository,
                        MetricRepository metricRepository) {
        this.aiInsightService = aiInsightService;
        this.plantRepository = plantRepository;
        this.metricRepository = metricRepository;
    }

    @GetMapping("/insights/{plantId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'OPERATOR')")
    public AiInsightService.AiInsight getPlantInsight(@PathVariable Long plantId) {
        EnergyPlant plant = plantRepository.findById(plantId).orElseThrow();
        List<Metric> recentMetrics = metricRepository.findTop30ByPlantIdOrderByRecordedAtDesc(plantId);
        return aiInsightService.generateInsight(plant, recentMetrics);
    }
}