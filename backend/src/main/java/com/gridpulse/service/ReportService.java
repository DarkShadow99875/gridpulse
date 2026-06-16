package com.gridpulse.service;

import com.gridpulse.model.EnergyPlant;
import com.gridpulse.model.Metric;
import com.gridpulse.repository.EnergyPlantRepository;
import com.gridpulse.repository.MetricRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ReportService {

    private final EnergyPlantRepository plantRepository;
    private final MetricRepository metricRepository;

    public ReportService(EnergyPlantRepository plantRepository, MetricRepository metricRepository) {
        this.plantRepository = plantRepository;
        this.metricRepository = metricRepository;
    }

    public byte[] generateEsgReport(Long plantId) {
        EnergyPlant plant = plantRepository.findById(plantId)
                .orElseThrow(() -> new RuntimeException("Impianto non trovato"));

        List<Metric> metrics = metricRepository.findByPlantIdOrderByRecordedAtDesc(plantId);
        if (metrics.size() > 60) metrics = metrics.subList(0, 60);

        double avgEfficiency = metrics.stream()
                .mapToDouble(m -> m.getEfficiency() != null ? m.getEfficiency() : 0)
                .average().orElse(0);

        double totalCo2 = metrics.stream()
                .mapToDouble(m -> m.getCo2Avoided() != null ? m.getCo2Avoided() : 0)
                .sum();

        double avgPower = metrics.stream()
                .mapToDouble(m -> m.getPowerOutput() != null ? m.getPowerOutput() : 0)
                .average().orElse(0);

        long carbonCredits = Math.round(totalCo2 / 1000);

        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            float width = page.getMediaBox().getWidth();
            float height = page.getMediaBox().getHeight();
            float margin = 50;
            float y = height - margin;

            try (PDPageContentStream cs = new PDPageContentStream(document, page)) {

                // Header
                cs.setFont(PDType1Font.HELVETICA_BOLD, 26);
                cs.setNonStrokingColor(0.05f, 0.35f, 0.25f);
                cs.beginText();
                cs.newLineAtOffset(margin, y);
                cs.showText(safeForPdf("GRIDPULSE"));
                cs.endText();
                y -= 22;

                cs.setFont(PDType1Font.HELVETICA, 11);
                cs.setNonStrokingColor(0.35f, 0.35f, 0.35f);
                cs.beginText();
                cs.newLineAtOffset(margin, y);
                cs.showText(safeForPdf("Report di Sostenibilità ESG • " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd MMMM yyyy", java.util.Locale.ITALY))));
                cs.endText();
                y -= 38;

                cs.setFont(PDType1Font.HELVETICA_BOLD, 18);
                cs.setNonStrokingColor(0f, 0f, 0f);
                cs.beginText();
                cs.newLineAtOffset(margin, y);
                cs.showText(safeForPdf("Report ESG - " + plant.getName()));
                cs.endText();
                y -= 18;

                cs.setFont(PDType1Font.HELVETICA, 12);
                cs.setNonStrokingColor(0.35f, 0.35f, 0.35f);
                cs.beginText();
                cs.newLineAtOffset(margin, y);
                cs.showText(safeForPdf(plant.getLocation() + "  •  Tipologia: " + plant.getType() + "  •  Capacità: " + plant.getCapacityMw() + " MW"));
                cs.endText();
                y -= 32;

                // KPI box
                drawKpiBox(cs, margin, y - 10, width - 2 * margin, avgEfficiency, totalCo2, carbonCredits, avgPower);
                y -= 105;

                // Section headers
                cs.setFont(PDType1Font.HELVETICA_BOLD, 13);
                cs.setNonStrokingColor(0.05f, 0.35f, 0.25f);
                cs.beginText();
                cs.newLineAtOffset(margin, y);
                cs.showText("PRESTAZIONI ENERGETICHE (ultimi 60 record)");
                cs.endText();
                y -= 20;

                cs.setFont(PDType1Font.HELVETICA, 10);
                cs.setNonStrokingColor(0f, 0f, 0f);
                String perf = String.format("Potenza media: %.1f MW   |   Efficienza media: %.1f%%", avgPower, avgEfficiency);
                cs.beginText();
                cs.newLineAtOffset(margin, y);
                cs.showText(safeForPdf(perf));
                cs.endText();
                y -= 26;

                cs.setFont(PDType1Font.HELVETICA_BOLD, 13);
                cs.setNonStrokingColor(0.05f, 0.35f, 0.25f);
                cs.beginText();
                cs.newLineAtOffset(margin, y);
                cs.showText("IMPATTO AMBIENTALE E CREDITI DI CARBONIO");
                cs.endText();
                y -= 18;

                cs.setFont(PDType1Font.HELVETICA, 10.5f);
                cs.setNonStrokingColor(0f, 0f, 0f);
                String co2Text = String.format("CO₂ evitato nel periodo analizzato: %.0f kg (%.1f tonnellate)", totalCo2, totalCo2 / 1000);
                cs.beginText();
                cs.newLineAtOffset(margin, y);
                cs.showText(safeForPdf(co2Text));
                cs.endText();
                y -= 16;

                String creditText = String.format("Crediti di carbonio generati (stima): %d tCO₂e", carbonCredits);
                cs.beginText();
                cs.newLineAtOffset(margin, y);
                cs.showText(safeForPdf(creditText));
                cs.endText();
                y -= 26;

                cs.setFont(PDType1Font.HELVETICA_BOLD, 13);
                cs.setNonStrokingColor(0.05f, 0.35f, 0.25f);
                cs.beginText();
                cs.newLineAtOffset(margin, y);
                cs.showText("RACCOMANDAZIONI E PROSSIMI PASSI");
                cs.endText();
                y -= 18;

                cs.setFont(PDType1Font.HELVETICA, 10);
                cs.setNonStrokingColor(0f, 0f, 0f);

                String rec = avgEfficiency > 85 
                    ? "Impianto in ottima salute. Mantenere il piano di manutenzione programmata."
                    : avgEfficiency > 75 
                        ? "Performance buona. Si raccomanda pulizia dei pannelli / controllo pale entro 3 settimane."
                        : "Attenzione richiesta: efficienza sotto soglia ottimale. Ispezione completa raccomandata entro 7 giorni.";

                y = drawWrappedText(cs, rec, margin, y, (int)(width - 2*margin), 13);

                // Footer
                cs.setFont(PDType1Font.HELVETICA, 9);
                cs.setNonStrokingColor(0.35f, 0.35f, 0.35f);
                cs.beginText();
                cs.newLineAtOffset(margin, 45);
                cs.showText(safeForPdf("GridPulse • Piattaforma AI per la transizione energetica • Documento generato automaticamente"));
                cs.endText();
            }

            document.save(baos);
            return baos.toByteArray();

        } catch (IOException e) {
            throw new RuntimeException("Errore generazione PDF ESG", e);
        }
    }

    private void drawKpiBox(PDPageContentStream cs, float x, float y, float w, double eff, double co2, long credits, double power) throws IOException {
        cs.setNonStrokingColor(0.96f, 0.97f, 0.95f);
        cs.addRect(x, y - 75, w, 80);
        cs.fill();

        cs.setStrokingColor(0.2f, 0.55f, 0.45f);
        cs.setLineWidth(1.5f);
        cs.addRect(x, y - 75, w, 80);
        cs.stroke();

        float colW = w / 4;
        float baseY = y - 18;

        drawKpi(cs, x + 12, baseY, "Efficienza Media", String.format("%.1f", eff) + "%");
        drawKpi(cs, x + colW + 8, baseY, "CO₂ Evitato", String.format("%.0f t", co2 / 1000));
        drawKpi(cs, x + 2*colW + 4, baseY, "Crediti Carbonio", credits + " tCO₂e");
        drawKpi(cs, x + 3*colW, baseY, "Potenza Media", String.format("%.1f MW", power));
    }

    private void drawKpi(PDPageContentStream cs, float x, float y, String label, String value) throws IOException {
        cs.setFont(PDType1Font.HELVETICA, 8);
        cs.setNonStrokingColor(0.3f, 0.3f, 0.3f);
        cs.beginText();
        cs.newLineAtOffset(x, y);
        cs.showText(safeForPdf(label));
        cs.endText();

        cs.setFont(PDType1Font.HELVETICA_BOLD, 15);
        cs.setNonStrokingColor(0.08f, 0.38f, 0.28f);
        cs.beginText();
        cs.newLineAtOffset(x, y - 20);
        cs.showText(safeForPdf(value));
        cs.endText();
    }

    /** Rimuove caratteri non supportati dai font Type1 standard (es. CO₂) */
    private String safeForPdf(String text) {
        if (text == null) return "";
        return text.replace("₂", "2");
    }

    private float drawWrappedText(PDPageContentStream cs, String text, float x, float y, int maxWidth, int lineHeight) throws IOException {
        // Simple word wrap without measuring exact font width (good enough for report)
        String[] words = text.split(" ");
        StringBuilder line = new StringBuilder();

        for (String word : words) {
            String test = line.length() == 0 ? word : line + " " + word;
            // Rough estimate: ~5.5 points per character at size 10
            if (test.length() * 5.5 > maxWidth) {
                cs.beginText();
                cs.newLineAtOffset(x, y);
                cs.showText(safeForPdf(line.toString()));
                cs.endText();
                y -= lineHeight;
                line = new StringBuilder(word);
            } else {
                line = new StringBuilder(test);
            }
        }

        if (line.length() > 0) {
            cs.beginText();
            cs.newLineAtOffset(x, y);
            cs.showText(line.toString());
            cs.endText();
            y -= lineHeight;
        }
        return y;
    }
}
