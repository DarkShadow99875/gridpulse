package com.gridpulse.service;

import com.gridpulse.model.EnergyPlant;
import com.gridpulse.model.Metric;
import com.gridpulse.repository.EnergyPlantRepository;
import com.gridpulse.repository.MetricRepository;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.OptionalDouble;

@Service
public class AiChatService {

    private final EnergyPlantRepository plantRepository;
    private final MetricRepository metricRepository;

    public AiChatService(EnergyPlantRepository plantRepository, MetricRepository metricRepository) {
        this.plantRepository = plantRepository;
        this.metricRepository = metricRepository;
    }

    public ChatResponse ask(String question, Long plantIdContext) {
        String q = question.toLowerCase(Locale.ITALIAN).trim();

        List<EnergyPlant> plants = plantRepository.findAll();
        EnergyPlant contextPlant = null;

        if (plantIdContext != null) {
            contextPlant = plantRepository.findById(plantIdContext).orElse(null);
        } else {
            for (EnergyPlant p : plants) {
                if (q.contains(p.getName().toLowerCase()) || 
                    q.contains(p.getLocation().toLowerCase().split(",")[0])) {
                    contextPlant = p;
                    break;
                }
            }
        }

        if (contextPlant == null && !plants.isEmpty()) {
            contextPlant = plants.get(0);
        }

        if (contextPlant == null) {
            return new ChatResponse("Non ho ancora dati sugli impianti. Prova a chiedere dopo aver creato dei dati demo.", "system");
        }

        List<Metric> recent = metricRepository.findTop30ByPlantIdOrderByRecordedAtDesc(contextPlant.getId());

        if (q.contains("stato") || q.contains("come sta") || q.contains("situazione")) {
            return plantStatus(contextPlant, recent);
        }
        if (q.contains("efficienza") || q.contains("performance") || q.contains("salute")) {
            return efficiencyAnalysis(contextPlant, recent);
        }
        if (q.contains("manutenzione") || q.contains("previsione") || q.contains("quando")) {
            return maintenancePrediction(contextPlant, recent);
        }
        if (q.contains("produzione") || q.contains("potenza") || q.contains("output") || q.contains("mw")) {
            return productionSummary(contextPlant, recent);
        }
        if (q.contains("co2") || q.contains("carbonio") || q.contains("emissioni") || q.contains("evitato")) {
            return co2Impact(contextPlant, recent);
        }
        if (q.contains("temperatura") || q.contains("caldo") || q.contains("anomalia")) {
            return temperatureAnalysis(contextPlant, recent);
        }
        if (q.contains("tutti") || q.contains("panoramica") || q.contains("overview")) {
            return overviewAllPlants(plants);
        }

        return generalInsight(contextPlant, recent, question);
    }

    private ChatResponse plantStatus(EnergyPlant plant, List<Metric> recent) {
        String status = plant.getStatus();
        double avgEff = averageEfficiency(recent);
        String emoji = status.equals("OPERATIONAL") ? "🟢" : status.equals("MAINTENANCE") ? "🟡" : "🔴";

        String answer = String.format(
            "%s L'impianto **%s** (%s) è attualmente in stato **%s**.\n" +
            "Efficienza media ultimi 30 record: **%.1f%%**.\n" +
            "Ultima rilevazione: %s.",
            emoji, plant.getName(), plant.getLocation(), status, avgEff,
            recent.isEmpty() ? "N/D" : recent.get(0).getRecordedAt().format(DateTimeFormatter.ofPattern("dd/MM HH:mm"))
        );
        return new ChatResponse(answer, "plant-status");
    }

    private ChatResponse efficiencyAnalysis(EnergyPlant plant, List<Metric> recent) {
        if (recent.isEmpty()) return new ChatResponse("Nessun dato disponibile per l'analisi.", "data");

        double avg = averageEfficiency(recent);
        double latest = recent.get(0).getEfficiency();
        String trend = latest > avg + 1.5 ? "in miglioramento" : latest < avg - 1.5 ? "in leggero calo" : "stabile";

        String answer = String.format(
            "📈 **Analisi efficienza %s**\n" +
            "• Media ultimi dati: **%.1f%%**\n" +
            "• Ultimo valore: **%.1f%%** (%s)\n" +
            "• Capacità installata: %.1f MW",
            plant.getName(), avg, latest, trend, plant.getCapacityMw()
        );
        return new ChatResponse(answer, "efficiency");
    }

    private ChatResponse maintenancePrediction(EnergyPlant plant, List<Metric> recent) {
        double avgEff = averageEfficiency(recent);
        String risk;
        String advice;

        if (avgEff < 72) {
            risk = "ALTA";
            advice = "Si consiglia ispezione urgente di inverter e pulizia moduli entro 48-72 ore.";
        } else if (avgEff < 82) {
            risk = "MEDIA";
            advice = "Pianificare manutenzione preventiva entro 10-14 giorni.";
        } else {
            risk = "BASSA";
            advice = "Prossimo controllo di routine consigliato tra 5-7 settimane.";
        }

        String answer = String.format(
            "🔧 **Previsione Manutenzione - %s**\n\n" +
            "Rischio attuale: **%s**\n" +
            "Efficienza media: %.1f%%\n\n%s",
            plant.getName(), risk, avgEff, advice
        );
        return new ChatResponse(answer, "maintenance");
    }

    private ChatResponse productionSummary(EnergyPlant plant, List<Metric> recent) {
        if (recent.isEmpty()) return new ChatResponse("Dati di produzione non disponibili.", "data");

        double avgPower = recent.stream().mapToDouble(m -> m.getPowerOutput() != null ? m.getPowerOutput() : 0).average().orElse(0);

        String answer = String.format(
            "⚡ **Produzione %s**\n" +
            "• Potenza media recente: **%.1f MW**\n" +
            "• Capacità nominale: %.1f MW",
            plant.getName(), avgPower, plant.getCapacityMw()
        );
        return new ChatResponse(answer, "production");
    }

    private ChatResponse co2Impact(EnergyPlant plant, List<Metric> recent) {
        double totalCo2 = recent.stream()
                .mapToDouble(m -> m.getCo2Avoided() != null ? m.getCo2Avoided() : 0)
                .sum();

        String answer = String.format(
            "🌍 **Impatto CO₂ Evitato - %s**\n\n" +
            "Negli ultimi record analizzati hai evitato **%.0f kg di CO₂**.",
            plant.getName(), totalCo2
        );
        return new ChatResponse(answer, "co2");
    }

    private ChatResponse temperatureAnalysis(EnergyPlant plant, List<Metric> recent) {
        if (recent.isEmpty()) return new ChatResponse("Nessun dato temperatura.", "data");

        double avgTemp = recent.stream().mapToDouble(Metric::getTemperature).average().orElse(0);
        double maxTemp = recent.stream().mapToDouble(Metric::getTemperature).max().orElse(0);

        String alert = maxTemp > 42 ? "\n⚠️ Attenzione: picchi di temperatura oltre i 42°C rilevati." : "";

        String answer = String.format(
            "🌡️ **Temperatura %s**\n" +
            "• Media periodo: %.1f °C\n" +
            "• Massimo: %.1f °C%s",
            plant.getName(), avgTemp, maxTemp, alert
        );
        return new ChatResponse(answer, "temperature");
    }

    private ChatResponse overviewAllPlants(List<EnergyPlant> plants) {
        StringBuilder sb = new StringBuilder("🌐 **Panoramica GridPulse - Tutti gli impianti**\n\n");
        for (EnergyPlant p : plants) {
            List<Metric> r = metricRepository.findTop30ByPlantIdOrderByRecordedAtDesc(p.getId());
            double eff = averageEfficiency(r);
            sb.append(String.format("• **%s** (%s) — %s — Eff. media: %.1f%% — Stato: %s\n",
                    p.getName(), p.getType(), p.getLocation(), eff, p.getStatus()));
        }
        return new ChatResponse(sb.toString(), "overview");
    }

    private ChatResponse generalInsight(EnergyPlant plant, List<Metric> recent, String originalQuestion) {
        double avgEff = averageEfficiency(recent);
        String answer = String.format(
            "Grazie per la domanda su **%s**.\n\n" +
            "In sintesi: l'impianto ha un'efficienza media del **%.1f%%** negli ultimi dati. " +
            "Stato: %s. Capacità: %.1f MW.\n\n" +
            "Puoi chiedermi: efficienza, manutenzione prevista, produzione, CO2 evitato o panoramica generale.",
            plant.getName(), avgEff, plant.getStatus(), plant.getCapacityMw()
        );
        return new ChatResponse(answer, "general");
    }

    private double averageEfficiency(List<Metric> metrics) {
        if (metrics == null || metrics.isEmpty()) return 0;
        OptionalDouble avg = metrics.stream()
                .mapToDouble(m -> m.getEfficiency() != null ? m.getEfficiency() : 0)
                .filter(e -> e > 0)
                .average();
        return avg.orElse(0);
    }

    public record ChatResponse(String answer, String intent) {}
}
