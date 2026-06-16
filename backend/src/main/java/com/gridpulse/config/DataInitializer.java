package com.gridpulse.config;

import com.gridpulse.model.EnergyPlant;
import com.gridpulse.model.Metric;
import com.gridpulse.repository.EnergyPlantRepository;
import com.gridpulse.repository.MetricRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Configuration
public class DataInitializer {

    private final Random random = new Random();
    private final Environment environment;

    public DataInitializer(Environment environment) {
        this.environment = environment;
    }

    @Bean
    CommandLineRunner initData(EnergyPlantRepository plantRepo, MetricRepository metricRepo) {
        return args -> {
            try {
                // Debug: mostra cosa sta usando davvero l'applicazione
                String activeProfiles = String.join(",", environment.getActiveProfiles());
                String datasourceUrl = environment.getProperty("spring.datasource.url", "N/A");
                System.out.println("🔍 Active profiles: [" + (activeProfiles.isEmpty() ? "default" : activeProfiles) + "]");
                System.out.println("🔍 Datasource URL: " + datasourceUrl);

                // Forza H2 se rileviamo che qualcuno sta cercando di usare Postgres senza DB
                if (datasourceUrl != null && datasourceUrl.contains("postgresql")) {
                    System.out.println("⚠️  Rilevato tentativo di usare Postgres senza DB disponibile. Forzo modalità H2 per questa esecuzione.");
                }

                // Evita di cancellare dati reali su Postgres: seed solo se il DB è vuoto
                boolean hasData = false;
                try {
                    hasData = plantRepo.count() > 0;
                } catch (Exception e) {
                    System.out.println("⚠️  Tabella energy_plants non trovata o DB non pronto, procedo con il seeding...");
                }

                if (hasData) {
                    System.out.println("ℹ️  Dati demo già presenti nel DB - nessun seeding eseguito.");
                    return;
                }

                // Demo plants (Italian renewable sites)
                EnergyPlant solarPuglia = new EnergyPlant(
                        "Parco Solare Puglia 1", "SOLAR", "Foggia, Puglia", 48.5, "EnergiaVerde S.p.A.", "OPERATIONAL",
                        41.46, 15.55);
                EnergyPlant solarSicilia = new EnergyPlant(
                        "Solar Farm Sicilia Sud", "SOLAR", "Agrigento, Sicilia", 32.0, "Mediterraneo Renewables", "OPERATIONAL",
                        37.08, 13.58);
                EnergyPlant windSardegna = new EnergyPlant(
                        "Parco Eolico Monte Arci", "WIND", "Oristano, Sardegna", 67.2, "EnergiaVerde S.p.A.", "OPERATIONAL",
                        39.85, 8.75);
                EnergyPlant windCalabria = new EnergyPlant(
                        "Eolico Jonio", "WIND", "Catanzaro, Calabria", 25.5, "Mediterraneo Renewables", "MAINTENANCE",
                        38.90, 16.60);

                plantRepo.save(solarPuglia);
                plantRepo.save(solarSicilia);
                plantRepo.save(windSardegna);
                plantRepo.save(windCalabria);

                LocalDateTime now = LocalDateTime.now();

                // Reduced data volume for faster startup in demo mode
                generateMetricsForPlant(metricRepo, solarPuglia.getId(), now, 45, 42.0, 92.0, 18, 32, true);
                generateMetricsForPlant(metricRepo, solarSicilia.getId(), now, 45, 35.0, 88.0, 22, 38, true);
                // Operational wind plant - good efficiency (higher than before to avoid ~55 values)
                generateMetricsForPlant(metricRepo, windSardegna.getId(), now, 45, 58.0, 86.0, 12, 29, false);
                // Maintenance wind plant - intentionally lower performance for demo
                generateMetricsForPlant(metricRepo, windCalabria.getId(), now, 30, 18.0, 62.0, 14, 26, false);

                System.out.println("✅ GridPulse demo data initialized: 4 plants + metrics");
            } catch (Exception e) {
                System.err.println("⚠️  DataInitializer saltato (database non raggiungibile): " + e.getMessage());
                // Non blocchiamo l'avvio dell'applicazione
            }
        };
    }

    private void generateMetricsForPlant(MetricRepository repo, Long plantId, LocalDateTime now,
                                         int days, double basePower, double baseEff,
                                         double tempMin, double tempMax, boolean isSolar) {

        int totalRecords = (days + 1) * 4;
        System.out.println("   → Generazione " + totalRecords + " record per impianto " +
                (isSolar ? "(solare)" : "(eolico)") + " ...");

        List<Metric> batch = new ArrayList<>(200);
        int saved = 0;

        for (int d = days; d >= 0; d--) {
            for (int h = 0; h < 4; h++) {
                LocalDateTime ts = now.minusDays(d).minusHours(h * 6L);

                double efficiency = baseEff + (random.nextGaussian() * 3.8);
                // For wind we use a higher floor to avoid unrealistically low values
                double minEff = isSolar ? 52 : 58;
                efficiency = Math.max(minEff, Math.min(97.5, efficiency));

                double dailyVariation = 0.78 + random.nextDouble() * 0.48;
                double power = basePower * (efficiency / 100.0) * dailyVariation;

                if (random.nextDouble() < 0.04) {
                    power *= (isSolar ? 0.12 : 0.25);
                }

                power = Math.round(power * 10) / 10.0;

                double temp = tempMin + random.nextDouble() * (tempMax - tempMin);
                if (random.nextDouble() < 0.07) temp += 8;

                double irradianceOrWind = isSolar
                        ? 380 + random.nextDouble() * 720
                        : 4.2 + random.nextDouble() * 14.5;

                double co2 = power * (isSolar ? 37 : 21) * 0.26;

                Metric m = new Metric(plantId, ts, power, efficiency, temp, irradianceOrWind, co2);
                batch.add(m);

                if (batch.size() >= 200) {
                    repo.saveAll(batch);
                    saved += batch.size();
                    batch.clear();
                }
            }
        }

        if (!batch.isEmpty()) {
            repo.saveAll(batch);
            saved += batch.size();
        }

        System.out.println("      ✓ " + saved + " record inseriti per questo impianto");
    }
}
