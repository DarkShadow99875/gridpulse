package com.gridpulse.service;

import com.gridpulse.dto.EnergyPlantDto;
import com.gridpulse.model.EnergyPlant;
import com.gridpulse.repository.EnergyPlantRepository;
import com.gridpulse.repository.MetricRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EnergyPlantService {

    private final EnergyPlantRepository plantRepository;
    private final MetricRepository metricRepository;

    public EnergyPlantService(EnergyPlantRepository plantRepository, MetricRepository metricRepository) {
        this.plantRepository = plantRepository;
        this.metricRepository = metricRepository;
    }

    public List<EnergyPlant> findAllFiltered(String search, String type, String status, String company) {
        return plantRepository.findAll().stream()
                .filter(p -> search == null || search.isBlank()
                        || containsIgnoreCase(p.getName(), search)
                        || containsIgnoreCase(p.getLocation(), search)
                        || containsIgnoreCase(p.getCompany(), search))
                .filter(p -> type == null || type.isBlank() || type.equalsIgnoreCase(p.getType()))
                .filter(p -> status == null || status.isBlank() || status.equalsIgnoreCase(p.getStatus()))
                .filter(p -> company == null || company.isBlank() || company.equalsIgnoreCase(p.getCompany()))
                .toList();
    }

    private boolean containsIgnoreCase(String value, String search) {
        return value != null && value.toLowerCase().contains(search.toLowerCase().trim());
    }

    public EnergyPlant findById(Long id) {
        return plantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Impianto non trovato: " + id));
    }

    @Transactional
    public EnergyPlant create(EnergyPlantDto dto) {
        validatePlant(dto);
        EnergyPlant plant = dto.toEntity();
        return plantRepository.save(plant);
    }

    @Transactional
    public EnergyPlant update(Long id, EnergyPlantDto dto) {
        EnergyPlant plant = findById(id);
        validatePlant(dto);
        dto.applyTo(plant);
        return plantRepository.save(plant);
    }

    @Transactional
    public void delete(Long id) {
        EnergyPlant plant = findById(id);
        metricRepository.findByPlantId(id).forEach(metricRepository::delete);
        plantRepository.delete(plant);
    }

    private void validatePlant(EnergyPlantDto dto) {
        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new IllegalArgumentException("Il nome dell'impianto è obbligatorio");
        }
        if (dto.getType() == null || dto.getType().isBlank()) {
            throw new IllegalArgumentException("Il tipo dell'impianto è obbligatorio");
        }
        if (dto.getLocation() == null || dto.getLocation().isBlank()) {
            throw new IllegalArgumentException("La località è obbligatoria");
        }
    }
}