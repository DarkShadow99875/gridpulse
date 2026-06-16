package com.gridpulse.controller;

import com.gridpulse.dto.EnergyPlantDto;
import com.gridpulse.dto.MetricDto;
import com.gridpulse.model.EnergyPlant;
import com.gridpulse.model.Metric;
import com.gridpulse.service.EnergyPlantService;
import com.gridpulse.service.MetricService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/plants")
public class PlantController {

    private final EnergyPlantService plantService;
    private final MetricService metricService;

    public PlantController(EnergyPlantService plantService, MetricService metricService) {
        this.plantService = plantService;
        this.metricService = metricService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PLANT_READ')")
    public List<EnergyPlantDto> getAllPlants(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String company) {
        return plantService.findAllFiltered(search, type, status, company).stream()
                .map(EnergyPlantDto::from)
                .toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PLANT_READ')")
    public EnergyPlantDto getPlant(@PathVariable Long id) {
        return EnergyPlantDto.from(plantService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PLANT_CREATE')")
    public ResponseEntity<EnergyPlantDto> createPlant(@RequestBody EnergyPlantDto dto) {
        EnergyPlant plant = plantService.create(dto);
        return ResponseEntity.ok(EnergyPlantDto.from(plant));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PLANT_UPDATE')")
    public ResponseEntity<EnergyPlantDto> updatePlant(@PathVariable Long id, @RequestBody EnergyPlantDto dto) {
        EnergyPlant plant = plantService.update(id, dto);
        return ResponseEntity.ok(EnergyPlantDto.from(plant));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PLANT_DELETE')")
    public ResponseEntity<Void> deletePlant(@PathVariable Long id) {
        plantService.delete(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/metrics")
    @PreAuthorize("hasAuthority('PLANT_READ')")
    public List<MetricDto> getPlantMetrics(@PathVariable Long id,
                                           @RequestParam(required = false) String start,
                                           @RequestParam(required = false) String end,
                                           @RequestParam(required = false) Integer limit) {
        return metricService.findByPlant(id, start, end, limit).stream()
                .map(MetricDto::from)
                .toList();
    }

    @GetMapping("/{id}/metrics/recent")
    @PreAuthorize("hasAuthority('PLANT_READ')")
    public List<MetricDto> getRecentMetrics(@PathVariable Long id) {
        return metricService.findRecent(id).stream()
                .map(MetricDto::from)
                .toList();
    }

    @PostMapping("/{id}/metrics")
    @PreAuthorize("hasAuthority('METRIC_WRITE')")
    public ResponseEntity<MetricDto> createMetric(@PathVariable Long id, @RequestBody MetricDto dto) {
        Metric metric = metricService.create(id, dto);
        return ResponseEntity.ok(MetricDto.from(metric));
    }
}