package com.gridpulse.repository;

import com.gridpulse.model.EnergyPlant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EnergyPlantRepository extends JpaRepository<EnergyPlant, Long> {
    List<EnergyPlant> findByCompany(String company);
    List<EnergyPlant> findByType(String type);
    List<EnergyPlant> findByStatus(String status);
}
