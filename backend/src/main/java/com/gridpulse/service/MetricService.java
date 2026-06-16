package com.gridpulse.service;

import com.gridpulse.dto.MetricDto;
import com.gridpulse.model.Metric;
import com.gridpulse.repository.EnergyPlantRepository;
import com.gridpulse.repository.MetricRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class MetricService {

    private final MetricRepository metricRepository;
    private final EnergyPlantRepository plantRepository;

    public MetricService(MetricRepository metricRepository, EnergyPlantRepository plantRepository) {
        this.metricRepository = metricRepository;
        this.plantRepository = plantRepository;
    }

    public List<Metric> findByPlant(Long plantId, String start, String end, Integer limit) {
        assertPlantExists(plantId);

        if (start != null && end != null) {
            LocalDate startDate = LocalDate.parse(start);
            LocalDate endDate = LocalDate.parse(end);
            return metricRepository.findByPlantIdAndRecordedAtBetweenOrderByRecordedAtAsc(
                    plantId,
                    startDate.atStartOfDay(),
                    endDate.atTime(23, 59, 59)
            );
        }

        int effectiveLimit = limit != null ? limit : 30;
        List<Metric> metrics = metricRepository.findByPlantIdOrderByRecordedAtDesc(plantId);
        return metrics.size() > effectiveLimit ? metrics.subList(0, effectiveLimit) : metrics;
    }

    public List<Metric> findRecent(Long plantId) {
        assertPlantExists(plantId);
        return metricRepository.findTop30ByPlantIdOrderByRecordedAtDesc(plantId);
    }

    public Metric findById(Long id) {
        return metricRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Metrica non trovata: " + id));
    }

    @Transactional
    public Metric create(Long plantId, MetricDto dto) {
        assertPlantExists(plantId);
        Metric metric = dto.toEntity();
        metric.setPlantId(plantId);
        if (metric.getRecordedAt() == null) {
            metric.setRecordedAt(LocalDateTime.now());
        }
        return metricRepository.save(metric);
    }

    @Transactional
    public Metric update(Long id, MetricDto dto) {
        Metric metric = findById(id);
        dto.applyTo(metric);
        return metricRepository.save(metric);
    }

    @Transactional
    public void delete(Long id) {
        Metric metric = findById(id);
        metricRepository.delete(metric);
    }

    private void assertPlantExists(Long plantId) {
        if (!plantRepository.existsById(plantId)) {
            throw new IllegalArgumentException("Impianto non trovato: " + plantId);
        }
    }
}