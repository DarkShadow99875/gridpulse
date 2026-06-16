package com.gridpulse.repository;

import com.gridpulse.model.Metric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface MetricRepository extends JpaRepository<Metric, Long> {
    List<Metric> findTop30ByPlantIdOrderByRecordedAtDesc(Long plantId);
    List<Metric> findByPlantId(Long plantId);
    List<Metric> findByPlantIdOrderByRecordedAtDesc(Long plantId);
    
    @Query("SELECT m FROM Metric m WHERE m.plantId = :plantId AND m.recordedAt >= :since ORDER BY m.recordedAt DESC")
    List<Metric> findRecentByPlantId(Long plantId, LocalDateTime since);
    
    List<Metric> findByPlantIdAndRecordedAtBetweenOrderByRecordedAtAsc(Long plantId, LocalDateTime start, LocalDateTime end);
}
