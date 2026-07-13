import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { geoEqualEarth, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";
import countries from "i18n-iso-countries";
import { ChevronRight } from "@/lib/icons";
import { useTheme } from "@/hooks/useTheme";
import { FadeIn } from "@/components/motion/Motion";
import { Container } from "@/components/ui/section";
import {
  fetchInflationRates,
  inflationByIso3,
  inflationColor,
  type InflationPoint,
} from "@/lib/inflation-api";
import { cn } from "@/lib/utils";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type CountryProps = { name?: string };
type CountryFeature = GeoJSON.Feature<Geometry, CountryProps> & { id?: string | number };

type TooltipState = {
  x: number;
  y: number;
  name: string;
  value: number | null;
  year?: string;
} | null;

async function loadWorld(): Promise<FeatureCollection<Geometry, CountryProps>> {
  const res = await fetch(GEO_URL);
  if (!res.ok) throw new Error("Failed to load world map");
  const topo = (await res.json()) as Topology<{ countries: GeometryCollection }>;
  return feature(topo, topo.objects.countries) as FeatureCollection<Geometry, CountryProps>;
}

function formatPct(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(2)}%`;
}

export function GlobalInflationMap() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(960);
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [hoverIso3, setHoverIso3] = useState<string | null>(null);

  const inflationQuery = useQuery({
    queryKey: ["worldbank-inflation"],
    queryFn: ({ signal }) => fetchInflationRates(signal),
    staleTime: 1000 * 60 * 60 * 12,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });

  const geoQuery = useQuery({
    queryKey: ["world-atlas-110m"],
    queryFn: loadWorld,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = Math.floor(entries[0]?.contentRect.width || 960);
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    setWidth(Math.floor(el.clientWidth || 960));
    return () => ro.disconnect();
  }, []);

  const byIso3 = useMemo(
    () => inflationByIso3(inflationQuery.data?.data ?? []),
    [inflationQuery.data]
  );

  const height = Math.max(280, Math.round(width * 0.48));

  const { path, features } = useMemo(() => {
    const feats = (geoQuery.data?.features ?? []) as CountryFeature[];
    const proj = geoEqualEarth().fitExtent(
      [
        [8, 12],
        [width - 8, height - 28],
      ],
      { type: "FeatureCollection", features: feats } as GeoPermissibleObjects
    );
    return {
      path: geoPath(proj),
      features: feats,
    };
  }, [geoQuery.data, width, height]);

  const loading = geoQuery.isLoading || inflationQuery.isLoading;

  return (
    <section id="economy" className="relative scroll-mt-20 border-t border-border bg-charcoal/40 py-12 md:py-16">
      <Container>
        <FadeIn>
          <div className="mb-6">
            <Link
              to="/world-economy"
              className="inline-flex items-center gap-1 font-display text-2xl font-bold tracking-tight text-foreground transition-colors hover:text-emerald md:text-3xl"
            >
              {t("inflationMap.economy")}
              <ChevronRight className="h-5 w-5 text-muted" />
            </Link>
            <Link
              to="/world-economy/trends"
              className="mt-2 flex items-center gap-1 text-base font-semibold text-foreground/90 transition-colors hover:text-emerald md:text-lg"
            >
              {t("inflationMap.title")}
              <ChevronRight className="h-4 w-4 text-muted" />
            </Link>
            <p className="mt-2 max-w-2xl text-sm text-muted">{t("inflationMap.subtitle")}</p>
          </div>

          <div
            ref={wrapRef}
            className={cn(
              "relative overflow-hidden rounded-2xl border border-border",
              isLight ? "bg-white" : "bg-[#121214]"
            )}
          >
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/60 text-sm text-muted backdrop-blur-sm">
                {t("inflationMap.loading")}
              </div>
            )}

            <svg
              viewBox={`0 0 ${width} ${height}`}
              width="100%"
              height={height}
              role="img"
              aria-label={t("inflationMap.title")}
              className="block w-full"
            >
              <rect width={width} height={height} fill={isLight ? "#ffffff" : "#121214"} />
              {features.map((f, i) => {
                const numericId = String(f.id ?? "").padStart(3, "0");
                const iso3 = countries.numericToAlpha3(numericId) || "";
                const point: InflationPoint | undefined = iso3 ? byIso3.get(iso3) : undefined;
                const d = path(f as GeoPermissibleObjects) || "";
                const fill = inflationColor(point?.value, isLight);
                const active = hoverIso3 === iso3;

                return (
                  <path
                    key={`${iso3 || "x"}-${i}`}
                    d={d}
                    fill={fill}
                    stroke={isLight ? "#ffffff" : "#1a1a1e"}
                    strokeWidth={active ? 1.25 : 0.4}
                    className="cursor-pointer transition-[opacity,stroke-width] duration-150"
                    opacity={hoverIso3 && !active ? 0.72 : 1}
                    onMouseEnter={(e) => {
                      if (!iso3) return;
                      setHoverIso3(iso3);
                      const rect = wrapRef.current?.getBoundingClientRect();
                      setTooltip({
                        x: e.clientX - (rect?.left ?? 0),
                        y: e.clientY - (rect?.top ?? 0),
                        name: point?.name || f.properties?.name || iso3,
                        value: point?.value ?? null,
                        year: point?.year,
                      });
                    }}
                    onMouseMove={(e) => {
                      const rect = wrapRef.current?.getBoundingClientRect();
                      setTooltip((prev) =>
                        prev
                          ? {
                              ...prev,
                              x: e.clientX - (rect?.left ?? 0),
                              y: e.clientY - (rect?.top ?? 0),
                            }
                          : prev
                      );
                    }}
                    onMouseLeave={() => {
                      setHoverIso3(null);
                      setTooltip(null);
                    }}
                  />
                );
              })}
            </svg>

            {tooltip && (
              <div
                className="pointer-events-none absolute z-20 min-w-[140px] rounded-lg border border-border bg-void/95 px-3 py-2 text-xs shadow-lg backdrop-blur-md"
                style={{
                  left: Math.min(Math.max(12, tooltip.x + 12), width - 160),
                  top: Math.max(12, tooltip.y - 48),
                }}
              >
                <p className="font-semibold text-foreground">{tooltip.name}</p>
                <p className="mt-0.5 font-mono text-emerald">
                  {formatPct(tooltip.value)}
                  {tooltip.year ? <span className="ml-1 text-muted">({tooltip.year})</span> : null}
                </p>
              </div>
            )}

            {/* Legend — TradingView style */}
            <div className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5">
              <div
                className="h-2.5 w-48 rounded-sm sm:w-64"
                style={{
                  background:
                    "linear-gradient(90deg, rgb(250,243,230) 0%, rgb(245,200,150) 28%, rgb(230,120,70) 55%, rgb(140,35,20) 100%)",
                }}
              />
              <div className="flex w-48 justify-between text-[10px] font-medium text-muted sm:w-64">
                <span>0%</span>
                <span>7%</span>
                <span className="inline-flex items-center gap-0.5">
                  25% <span aria-hidden="true">→</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/world-economy/trends"
              className="inline-flex items-center gap-1 text-sm font-semibold text-emerald hover:underline"
            >
              {t("inflationMap.seeMore")}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
            <p className="text-[11px] text-muted">
              {inflationQuery.data?.source === "worldbank"
                ? t("inflationMap.sourceLive")
                : t("inflationMap.sourceFallback")}
            </p>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
