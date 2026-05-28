package com.gridpulse.repository;

import com.gridpulse.model.Metric;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MetricRepository extends JpaRepository<Metric, Long> {
    List<Metric> findTop30ByPlantIdOrderByRecordedAtDesc(Long plantId);
    List<Metric> findByPlantId(Long plantId);
}