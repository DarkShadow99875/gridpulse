package com.gridpulse.controller;

import com.gridpulse.dto.SiteAnalysisRequest;
import com.gridpulse.dto.SiteAnalysisResponse;
import com.gridpulse.service.SiteAnalysisService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analysis")
@CrossOrigin(origins = "*")
public class SiteAnalysisController {

    private final SiteAnalysisService siteAnalysisService;

    public SiteAnalysisController(SiteAnalysisService siteAnalysisService) {
        this.siteAnalysisService = siteAnalysisService;
    }

    @PostMapping("/site-suitability")
    // Temporarily public for testing the geo feature.
    // In production you can put back @PreAuthorize("hasAuthority('PLANT_READ')")
    public SiteAnalysisResponse analyzeSiteSuitability(@RequestBody SiteAnalysisRequest request) {
        if (request.getLatitude() == null || request.getLongitude() == null) {
            throw new IllegalArgumentException("Latitude and longitude are required");
        }

        // Controllo geografico: analisi disponibile solo per il territorio italiano
        if (!isWithinItaly(request.getLatitude(), request.getLongitude())) {
            throw new IllegalArgumentException(
                "L'analisi territoriale è attualmente disponibile solo per il territorio italiano. " +
                "Seleziona un punto all'interno dei confini italiani."
            );
        }

        return siteAnalysisService.analyzeSite(request);
    }

    /**
     * Bounding box approssimativo per l'Italia (continente + isole maggiori).
     * Include un margine di sicurezza per coprire coste e piccole isole.
     */
    private boolean isWithinItaly(double lat, double lon) {
        // Bounding box Italia (approssimativo ma efficace)
        final double minLat = 35.3;   // Sud della Sicilia
        final double maxLat = 47.2;   // Nord delle Alpi
        final double minLon = 6.4;    // Ovest Sardegna / Liguria
        final double maxLon = 19.0;   // Est Puglia

        return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
    }
}
