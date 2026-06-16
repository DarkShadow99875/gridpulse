package com.gridpulse.controller;

import com.gridpulse.model.EnergyPlant;
import com.gridpulse.model.Metric;
import com.gridpulse.repository.EnergyPlantRepository;
import com.gridpulse.repository.MetricRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/plants")
public class PlantController {

    private final EnergyPlantRepository plantRepository;
    private final MetricRepository metricRepository;

    public PlantController(EnergyPlantRepository plantRepository, MetricRepository metricRepository) {
        this.plantRepository = plantRepository;
        this.metricRepository = metricRepository;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PLANT_READ')")
    public List<EnergyPlant> getAllPlants(@RequestParam(required = false) String company) {
        if (company != null && !company.isBlank()) {
            return plantRepository.findByCompany(company);
        }
        return plantRepository.findAll();
    }

    @GetMapping("/{id}")
    public EnergyPlant getPlant(@PathVariable Long id) {
        return plantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plant not found: " + id));
    }

    @GetMapping("/{id}/metrics")
    public List<Metric> getPlantMetrics(@PathVariable Long id,
                                        @RequestParam(required = false) String start,
                                        @RequestParam(required = false) String end,
                                        @RequestParam(required = false) Integer limit) {

        if (start != null && end != null) {
            LocalDate startDate = LocalDate.parse(start);
            LocalDate endDate = LocalDate.parse(end);
            LocalDateTime startDateTime = startDate.atStartOfDay();
            LocalDateTime endDateTime = endDate.atTime(23, 59, 59);
            return metricRepository.findByPlantIdAndRecordedAtBetweenOrderByRecordedAtAsc(id, startDateTime, endDateTime);
        }

        int effectiveLimit = (limit != null) ? limit : 30;
        List<Metric> metrics = metricRepository.findByPlantIdOrderByRecordedAtDesc(id);
        return metrics.size() > effectiveLimit ? metrics.subList(0, effectiveLimit) : metrics;
    }

    @GetMapping("/{id}/metrics/recent")
    public List<Metric> getRecentMetrics(@PathVariable Long id) {
        return metricRepository.findTop30ByPlantIdOrderByRecordedAtDesc(id);
    }
}
