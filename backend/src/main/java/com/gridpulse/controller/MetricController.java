package com.gridpulse.controller;

import com.gridpulse.dto.MetricDto;
import com.gridpulse.model.Metric;
import com.gridpulse.service.MetricService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/metrics")
public class MetricController {

    private final MetricService metricService;

    public MetricController(MetricService metricService) {
        this.metricService = metricService;
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PLANT_READ')")
    public MetricDto getMetric(@PathVariable Long id) {
        return MetricDto.from(metricService.findById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('METRIC_WRITE')")
    public ResponseEntity<MetricDto> updateMetric(@PathVariable Long id, @RequestBody MetricDto dto) {
        Metric metric = metricService.update(id, dto);
        return ResponseEntity.ok(MetricDto.from(metric));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('METRIC_WRITE')")
    public ResponseEntity<Void> deleteMetric(@PathVariable Long id) {
        metricService.delete(id);
        return ResponseEntity.ok().build();
    }
}