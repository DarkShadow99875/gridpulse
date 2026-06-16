package com.gridpulse.controller;

import com.gridpulse.service.ReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/esg/{plantId}")
    public ResponseEntity<byte[]> downloadEsgReport(@PathVariable Long plantId) {
        byte[] pdf = reportService.generateEsgReport(plantId);

        String filename = "GridPulse_ESG_Report_" + plantId + "_" + java.time.LocalDate.now() + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
