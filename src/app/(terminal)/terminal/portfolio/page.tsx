import { ScheduledModulePlaceholder } from "@/components/terminal/ScheduledModulePlaceholder";

export default function PortfolioPage() {
  return (
    <ScheduledModulePlaceholder
      code="MOD-PORTFOLIO"
      titleId="Matriks Korelasi Multi-Aset, VaR & Kelly"
      titleEn="Multi-Asset Correlation Matrix, VaR & Kelly"
      summaryId="Analisis risiko gabungan lintas saham BEI, kripto, dan emas untuk mendeteksi korelasi tersembunyi saat market crash beserta Value-at-Risk 95%."
      summaryEn="Cross-asset Pearson correlation heatmap, 95% Value-at-Risk (VaR), and Half-Kelly capital allocation across IDX equities, crypto, and gold."
      specs={[
        "90D Historical Pearson Matrix",
        "Parametric & Historical VaR 95%",
        "Sector Concentration Alert",
        "Half-Kelly Portfolio Weights",
      ]}
    />
  );
}
