import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@/lib/market-api";
import { useTheme } from "@/hooks/useTheme";

interface TradingChartProps {
  candles: Candle[];
  symbol: string;
  loading?: boolean;
}

function chartTheme(isLight: boolean) {
  return {
    background: isLight ? "#ffffff" : "#0a0a0c",
    text: isLight ? "#64748b" : "#9ca3af",
    grid: isLight ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.04)",
    border: isLight ? "rgba(15,23,42,0.1)" : "rgba(255,255,255,0.06)",
  };
}

export function TradingChart({ candles, symbol, loading }: TradingChartProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const fittedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const colors = chartTheme(isLight);

    const getHeight = () => {
      const w = containerRef.current?.clientWidth ?? 600;
      return w < 640 ? 320 : 420;
    };

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: colors.background },
        textColor: colors.text,
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: colors.border },
      timeScale: { borderColor: colors.border, timeVisible: true },
      width: containerRef.current.clientWidth || 600,
      height: getHeight(),
      autoSize: false,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderUpColor: "#10b981",
      borderDownColor: "#ef4444",
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#26a69a",
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    fittedRef.current = false;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry || !chartRef.current) return;
      const width = Math.floor(entry.contentRect.width);
      const height = width < 640 ? 320 : 420;
      if (width > 0) {
        chartRef.current.applyOptions({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [isLight]);

  useEffect(() => {
    fittedRef.current = false;
  }, [symbol]);

  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || candles.length === 0) return;

    const candleData = candles.map((c) => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const volumeData = candles.map((c) => ({
      time: c.time as UTCTimestamp,
      value: c.volume,
      color: c.close >= c.open ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)",
    }));

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);

    if (!fittedRef.current) {
      chartRef.current?.timeScale().fitContent();
      fittedRef.current = true;
    }
  }, [candles, symbol, isLight]);

  return (
    <div className="relative min-h-[320px] overflow-hidden surface-panel sm:min-h-[420px]">
      {loading && candles.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/90 text-sm text-muted">
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald/30 border-t-emerald" />
            Loading chart…
          </span>
        </div>
      )}
      {!loading && candles.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-muted">
          No chart data available
        </div>
      )}
      <div ref={containerRef} className="h-[320px] w-full sm:h-[420px]" />
    </div>
  );
}
