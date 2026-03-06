import { useEffect, useMemo, useState } from 'react';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

type Period = '7d' | '48h';

type Location = {
  prefecture: string;
  city: string;
  lat: number;
  lon: number;
};

type WeatherMetric = {
  value: number | null;
  unit: string;
  targetAt: string;
};

type ForecastPoint = {
  label: string;
  temperature: WeatherMetric;
  humidity: WeatherMetric;
  rain: WeatherMetric;
  wbgt: WeatherMetric;
  windSpeed: WeatherMetric;
  windDirection: WeatherMetric;
};

type ForecastSeries = {
  points: ForecastPoint[];
};

type RuntimeConfig = {
  defaultDrawingUrl: string;
};

const LOCATIONS: Location[] = [
  { prefecture: '東京都', city: '千代田区', lat: 35.6938, lon: 139.753 },
  { prefecture: '神奈川県', city: '横浜市', lat: 35.4437, lon: 139.638 },
  { prefecture: '愛知県', city: '名古屋市', lat: 35.1815, lon: 136.9066 },
  { prefecture: '大阪府', city: '大阪市', lat: 34.6937, lon: 135.5023 },
  { prefecture: '福岡県', city: '福岡市', lat: 33.5892, lon: 130.4017 },
];

const DEFAULT_LOCATION = LOCATIONS[0];
const DEFAULT_PERIOD: Period = '48h';

const DIRECTION_LABELS = [
  '北',
  '北北東',
  '北東',
  '東北東',
  '東',
  '東南東',
  '南東',
  '南南東',
  '南',
  '南南西',
  '南西',
  '西南西',
  '西',
  '西北西',
  '北西',
  '北北西',
];

function toDirectionLabel(degrees: number | null): string {
  if (degrees === null || Number.isNaN(degrees)) {
    return '-';
  }

  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return `${DIRECTION_LABELS[index]} (${normalized.toFixed(0)}deg)`;
}

function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatHourLabel(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:00`;
}

function formatDayLabel(date: Date, isToday: boolean): string {
  return isToday
    ? `${date.getMonth() + 1}/${date.getDate()} (本日)`
    : `${date.getMonth() + 1}/${date.getDate()}`;
}

function getWbgtApprox(temperature: number, humidity: number): number {
  const vaporPressure = (humidity / 100) * 6.105 * Math.exp((17.27 * temperature) / (237.7 + temperature));
  return 0.567 * temperature + 0.393 * vaporPressure + 3.94;
}

function average(values: Array<number | null | undefined>): number | null {
  const valid = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (!valid.length) {
    return null;
  }

  const total = valid.reduce((sum, value) => sum + value, 0);
  return total / valid.length;
}

function parseInitialState(configDefaultDrawingUrl: string): {
  location: Location;
  period: Period;
  drawingUrl: string;
} {
  const params = new URLSearchParams(window.location.search);

  const pref = params.get('pref') ?? DEFAULT_LOCATION.prefecture;
  const city = params.get('city') ?? DEFAULT_LOCATION.city;

  const periodParam = params.get('period');
  const period: Period = periodParam === '7d' ? '7d' : '48h';

  const drawingUrl = params.get('drawingUrl') ?? configDefaultDrawingUrl;

  const matchedLocation =
    LOCATIONS.find((loc) => loc.prefecture === pref && loc.city === city) ?? DEFAULT_LOCATION;

  return {
    location: matchedLocation,
    period,
    drawingUrl,
  };
}

function toQuery(location: Location, period: Period, drawingUrl: string): string {
  const params = new URLSearchParams();
  params.set('pref', location.prefecture);
  params.set('city', location.city);
  params.set('period', period);
  if (drawingUrl) {
    params.set('drawingUrl', drawingUrl);
  }
  return params.toString();
}

async function fetchRuntimeConfig(): Promise<RuntimeConfig> {
  try {
    const response = await fetch('/config/runtime-config.json');
    if (!response.ok) {
      return { defaultDrawingUrl: '/sample-drawing.pdf' };
    }

    const body = (await response.json()) as Partial<RuntimeConfig>;
    return {
      defaultDrawingUrl: body.defaultDrawingUrl ?? '/sample-drawing.pdf',
    };
  } catch {
    return { defaultDrawingUrl: '/sample-drawing.pdf' };
  }
}

type HourlyPayload = {
  time?: string[];
  temperature_2m?: Array<number | null>;
  relative_humidity_2m?: Array<number | null>;
  precipitation?: Array<number | null>;
  wind_speed_10m?: Array<number | null>;
  wind_direction_10m?: Array<number | null>;
};

type HourlyEntry = {
  at: Date;
  temperature: number | null;
  humidity: number | null;
  rain: number | null;
  windSpeed: number | null;
  windDirection: number | null;
};

function createHourlyEntries(hourly?: HourlyPayload): HourlyEntry[] {
  const times = hourly?.time ?? [];
  const temperatures = hourly?.temperature_2m ?? [];
  const humidities = hourly?.relative_humidity_2m ?? [];
  const rains = hourly?.precipitation ?? [];
  const windSpeeds = hourly?.wind_speed_10m ?? [];
  const windDirections = hourly?.wind_direction_10m ?? [];

  return times.map((time, index) => ({
    at: new Date(time),
    temperature: temperatures[index] ?? null,
    humidity: humidities[index] ?? null,
    rain: rains[index] ?? null,
    windSpeed: windSpeeds[index] ?? null,
    windDirection: windDirections[index] ?? null,
  }));
}

function toMetric(value: number | null, unit: string, targetAt: string): WeatherMetric {
  return { value, unit, targetAt };
}

function build48hSeries(entries: HourlyEntry[]): ForecastPoint[] {
  const now = new Date();
  const start = new Date(now);
  start.setMinutes(0, 0, 0);

  return Array.from({ length: 8 }, (_, index) => {
    const target = new Date(start.getTime() + index * 6 * 60 * 60 * 1000);
    const matched = entries.find((entry) => entry.at.getTime() >= target.getTime()) ?? null;

    const temperature = matched?.temperature ?? null;
    const humidity = matched?.humidity ?? null;
    const rain = matched?.rain ?? null;
    const windSpeed = matched?.windSpeed ?? null;
    const windDirection = matched?.windDirection ?? null;
    const wbgt =
      temperature !== null && humidity !== null
        ? getWbgtApprox(temperature, humidity)
        : null;

    return {
      label: index === 0 ? '現在' : formatHourLabel(target),
      temperature: toMetric(temperature, 'degC', target.toISOString()),
      humidity: toMetric(humidity, '%', target.toISOString()),
      rain: toMetric(rain, 'mm/h', target.toISOString()),
      wbgt: toMetric(wbgt, 'degC', target.toISOString()),
      windSpeed: toMetric(windSpeed, 'm/s', target.toISOString()),
      windDirection: toMetric(windDirection, 'deg', target.toISOString()),
    };
  });
}

function build7dSeries(entries: HourlyEntry[]): ForecastPoint[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today.getTime() + index * 24 * 60 * 60 * 1000);
    const dayKey = toDayKey(day);
    const dayEntries = entries.filter((entry) => toDayKey(entry.at) === dayKey);

    const temperature = average(dayEntries.map((entry) => entry.temperature));
    const humidity = average(dayEntries.map((entry) => entry.humidity));
    const rain = dayEntries.reduce<number>((sum, entry) => sum + (entry.rain ?? 0), 0);
    const windSpeed = average(dayEntries.map((entry) => entry.windSpeed));
    const windDirection = average(dayEntries.map((entry) => entry.windDirection));
    const wbgt =
      temperature !== null && humidity !== null
        ? getWbgtApprox(temperature, humidity)
        : null;

    return {
      label: formatDayLabel(day, index === 0),
      temperature: toMetric(temperature, 'degC', day.toISOString()),
      humidity: toMetric(humidity, '%', day.toISOString()),
      rain: toMetric(dayEntries.length ? rain : null, 'mm/day', day.toISOString()),
      wbgt: toMetric(wbgt, 'degC', day.toISOString()),
      windSpeed: toMetric(windSpeed, 'm/s', day.toISOString()),
      windDirection: toMetric(windDirection, 'deg', day.toISOString()),
    };
  });
}

async function fetchWeather(location: Location, period: Period): Promise<ForecastSeries> {
  const forecastDays = period === '7d' ? 7 : 3;
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(location.lat));
  url.searchParams.set('longitude', String(location.lon));
  url.searchParams.set('timezone', 'Asia/Tokyo');
  url.searchParams.set('forecast_days', String(forecastDays));
  url.searchParams.set('hourly', 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('気象情報の取得に失敗しました');
  }

  const body = (await response.json()) as { hourly?: HourlyPayload };
  const entries = createHourlyEntries(body.hourly);
  const points = period === '7d' ? build7dSeries(entries) : build48hSeries(entries);
  return { points };
}

function formatValue(value: number | null, digits = 1): string {
  if (value === null || Number.isNaN(value)) {
    return '-';
  }
  return value.toFixed(digits);
}

function App() {
  const [config, setConfig] = useState<RuntimeConfig>({ defaultDrawingUrl: '/sample-drawing.pdf' });
  const [selectedLocation, setSelectedLocation] = useState<Location>(DEFAULT_LOCATION);
  const [period, setPeriod] = useState<Period>(DEFAULT_PERIOD);
  const [drawingUrl, setDrawingUrl] = useState<string>('/sample-drawing.pdf');
  const [weather, setWeather] = useState<ForecastSeries | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    fetchRuntimeConfig().then((runtimeConfig) => {
      if (!mounted) {
        return;
      }

      setConfig(runtimeConfig);
      const initial = parseInitialState(runtimeConfig.defaultDrawingUrl);
      setSelectedLocation(initial.location);
      setPeriod(initial.period);
      setDrawingUrl(initial.drawingUrl);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const query = toQuery(selectedLocation, period, drawingUrl);
    window.history.replaceState(null, '', `?${query}`);
  }, [selectedLocation, period, drawingUrl]);

  useEffect(() => {
    let mounted = true;

    async function loadWeather(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchWeather(selectedLocation, period);
        if (mounted) {
          setWeather(result);
        }
      } catch (caughtError) {
        if (mounted) {
          const message = caughtError instanceof Error ? caughtError.message : '予期しないエラーです';
          setError(message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadWeather();

    return () => {
      mounted = false;
    };
  }, [selectedLocation, period]);

  const groupedLocations = useMemo(() => {
    return LOCATIONS.reduce<Record<string, Location[]>>((acc, location) => {
      if (!acc[location.prefecture]) {
        acc[location.prefecture] = [];
      }
      acc[location.prefecture].push(location);
      return acc;
    }, {});
  }, []);

  const selectedPrefecture = selectedLocation.prefecture;
  const cityCandidates = groupedLocations[selectedPrefecture] ?? [];

  return (
    <div className="dashboard-shell container-fluid px-3 py-3 px-md-4 py-md-4">
      <header className="dashboard-header card shadow-sm mb-3 mb-md-4 p-3">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-4">
            <label className="form-label mb-1" htmlFor="prefecture">
              都道府県
            </label>
            <select
              id="prefecture"
              className="form-select"
              value={selectedPrefecture}
              onChange={(event) => {
                const nextPrefecture = event.target.value;
                const nextCity = groupedLocations[nextPrefecture]?.[0] ?? DEFAULT_LOCATION;
                setSelectedLocation(nextCity);
              }}
            >
              {Object.keys(groupedLocations).map((prefecture) => (
                <option key={prefecture} value={prefecture}>
                  {prefecture}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-4">
            <label className="form-label mb-1" htmlFor="city">
              市区町村
            </label>
            <select
              id="city"
              className="form-select"
              value={selectedLocation.city}
              onChange={(event) => {
                const next = cityCandidates.find((candidate) => candidate.city === event.target.value);
                if (next) {
                  setSelectedLocation(next);
                }
              }}
            >
              {cityCandidates.map((candidate) => (
                <option key={`${candidate.prefecture}-${candidate.city}`} value={candidate.city}>
                  {candidate.city}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-2">
            <label className="form-label mb-1" htmlFor="period">
              予報期間
            </label>
            <select
              id="period"
              className="form-select"
              value={period}
              onChange={(event) => setPeriod(event.target.value === '7d' ? '7d' : '48h')}
            >
              <option value="48h">48時間</option>
              <option value="7d">7日</option>
            </select>
          </div>
          <div className="col-12 col-md-2">
            <label className="form-label mb-1" htmlFor="drawingUrl">
              図面URL
            </label>
            <input
              id="drawingUrl"
              className="form-control"
              value={drawingUrl}
              onChange={(event) => setDrawingUrl(event.target.value)}
              placeholder={config.defaultDrawingUrl}
            />
          </div>
        </div>
      </header>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <main className="row g-3 g-md-4">
        <section className="col-12 col-lg-3">
          <div className="metric-stack d-grid gap-3">
            <MetricChartCard
              title="気温"
              unit="degC"
              points={weather?.points ?? []}
              pickMetric={(point) => point.temperature.value}
              loading={loading}
            />
            <MetricChartCard
              title="湿度"
              unit="%"
              points={weather?.points ?? []}
              pickMetric={(point) => point.humidity.value}
              loading={loading}
            />
            <MetricChartCard
              title="降雨"
              unit={period === '7d' ? 'mm/day' : 'mm/h'}
              points={weather?.points ?? []}
              pickMetric={(point) => point.rain.value}
              loading={loading}
            />
          </div>
        </section>

        <section className="col-12 col-lg-6">
          <article className="card metric-card shadow-sm h-100 p-3 p-md-4">
            <h2 className="section-title">図面</h2>
            <div className="pdf-frame-wrap mt-2">
              {drawingUrl ? (
                <iframe
                  title="工事図面"
                  src={drawingUrl}
                  className="pdf-frame"
                  loading="lazy"
                />
              ) : (
                <p className="text-muted mb-0">図面URLを指定してください。</p>
              )}
            </div>
          </article>
        </section>

        <section className="col-12 col-lg-3">
          <div className="metric-stack d-grid gap-3">
            <MetricChartCard
              title="暑さ指数 (WBGT)"
              unit="degC"
              points={weather?.points ?? []}
              pickMetric={(point) => point.wbgt.value}
              loading={loading}
            />
            <MetricChartCard
              title="風速"
              unit="m/s"
              points={weather?.points ?? []}
              pickMetric={(point) => point.windSpeed.value}
              loading={loading}
            />
            <WindDirectionCard points={weather?.points ?? []} loading={loading} />
          </div>
        </section>
      </main>
    </div>
  );
}

type MetricChartCardProps = {
  title: string;
  unit: string;
  points: ForecastPoint[];
  pickMetric: (point: ForecastPoint) => number | null;
  loading: boolean;
};

function MetricChartCard({ title, unit, points, pickMetric, loading }: MetricChartCardProps) {
  const labels = points.map((point) => point.label);
  const values = points.map((point) => pickMetric(point));
  const latestValue = [...values].reverse().find((value) => value !== null) ?? null;
  const hasData = values.some((value) => value !== null);

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        borderColor: '#1f7fbf',
        backgroundColor: 'rgba(31, 127, 191, 0.14)',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 4,
        pointBackgroundColor: '#0f2d46',
        tension: 0.25,
        fill: true,
        spanGaps: false,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            return `${formatValue(typeof value === 'number' ? value : null)} ${unit}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: '#e1e8ef',
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          color: '#607283',
          font: {
            size: 10,
          },
        },
      },
      y: {
        grid: {
          color: '#e1e8ef',
        },
        ticks: {
          color: '#607283',
          font: {
            size: 10,
          },
        },
      },
    },
  };

  return (
    <article className="card metric-card shadow-sm p-3 p-md-4">
      <h2 className="section-title">{title}</h2>
      {loading ? (
        <p className="metric-updated mt-3 mb-0">読み込み中...</p>
      ) : (
        <>
          <p className="metric-updated mt-2 mb-2">最新: {formatValue(latestValue)} {unit}</p>
          {hasData ? (
            <div className="chartjs-wrap">
              <Line data={chartData} options={chartOptions} />
            </div>
          ) : (
            <p className="metric-updated mb-0">グラフ表示データなし</p>
          )}
        </>
      )}
    </article>
  );
}

type WindDirectionCardProps = {
  points: ForecastPoint[];
  loading: boolean;
};

function WindDirectionCard({ points, loading }: WindDirectionCardProps) {
  const hasData = points.some((point) => point.windDirection.value !== null);

  return (
    <article className="card metric-card shadow-sm p-3 p-md-4">
      <h2 className="section-title">風向</h2>
      {loading ? (
        <p className="metric-updated mt-3 mb-0">読み込み中...</p>
      ) : hasData ? (
        <div className="wind-row mt-3">
          {points.map((point) => {
            const value = point.windDirection.value;
            return (
              <div className="wind-item" key={`wind-${point.label}`}>
                <p className="wind-label mb-1">{point.label}</p>
                {value === null ? (
                  <p className="wind-empty mb-1">-</p>
                ) : (
                  <span className="wind-arrow" style={{ transform: `rotate(${value}deg)` }}>
                    ↑
                  </span>
                )}
                <p className="wind-dir mb-0">{toDirectionLabel(value)}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="metric-updated mt-3 mb-0">風向データなし</p>
      )}
    </article>
  );
}

export default App;
