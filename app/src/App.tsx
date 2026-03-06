import { useEffect, useMemo, useState } from 'react';
import './App.css';

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
  updatedAt: string;
};

type WeatherSummary = {
  temperature: WeatherMetric;
  humidity: WeatherMetric;
  rain: WeatherMetric;
  wbgt: WeatherMetric;
  windSpeed: WeatherMetric;
  windDirection: WeatherMetric;
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

async function fetchWeather(location: Location, period: Period): Promise<WeatherSummary> {
  const forecastDays = period === '7d' ? 7 : 2;
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

  const body = (await response.json()) as {
    hourly?: {
      time?: string[];
      temperature_2m?: Array<number | null>;
      relative_humidity_2m?: Array<number | null>;
      precipitation?: Array<number | null>;
      wind_speed_10m?: Array<number | null>;
      wind_direction_10m?: Array<number | null>;
    };
  };

  const hourly = body.hourly;
  const lastIndex = (hourly?.time?.length ?? 1) - 1;
  const latestTime = hourly?.time?.[lastIndex] ?? '-';

  const temperatureAvg = average(hourly?.temperature_2m ?? []);
  const humidityAvg = average(hourly?.relative_humidity_2m ?? []);
  const rainSum = (hourly?.precipitation ?? []).reduce<number>(
    (sum, value) => sum + (value ?? 0),
    0,
  );
  const windSpeedAvg = average(hourly?.wind_speed_10m ?? []);
  const windDirectionAvg = average(hourly?.wind_direction_10m ?? []);

  const wbgt =
    temperatureAvg !== null && humidityAvg !== null
      ? getWbgtApprox(temperatureAvg, humidityAvg)
      : null;

  return {
    temperature: { value: temperatureAvg, unit: 'degC', updatedAt: latestTime },
    humidity: { value: humidityAvg, unit: '%', updatedAt: latestTime },
    rain: { value: rainSum, unit: 'mm', updatedAt: latestTime },
    wbgt: { value: wbgt, unit: 'degC', updatedAt: latestTime },
    windSpeed: { value: windSpeedAvg, unit: 'm/s', updatedAt: latestTime },
    windDirection: { value: windDirectionAvg, unit: 'deg', updatedAt: latestTime },
  };
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
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
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
            <MetricCard
              title="気温"
              value={weather ? formatValue(weather.temperature.value) : '-'}
              unit={weather?.temperature.unit ?? 'degC'}
              loading={loading}
              updatedAt={weather?.temperature.updatedAt}
            />
            <MetricCard
              title="湿度"
              value={weather ? formatValue(weather.humidity.value) : '-'}
              unit={weather?.humidity.unit ?? '%'}
              loading={loading}
              updatedAt={weather?.humidity.updatedAt}
            />
            <MetricCard
              title="降雨"
              value={weather ? formatValue(weather.rain.value) : '-'}
              unit={weather?.rain.unit ?? 'mm'}
              loading={loading}
              updatedAt={weather?.rain.updatedAt}
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
            <MetricCard
              title="暑さ指数 (WBGT)"
              value={weather ? formatValue(weather.wbgt.value) : '-'}
              unit={weather?.wbgt.unit ?? 'degC'}
              loading={loading}
              updatedAt={weather?.wbgt.updatedAt}
            />
            <MetricCard
              title="風速"
              value={weather ? formatValue(weather.windSpeed.value) : '-'}
              unit={weather?.windSpeed.unit ?? 'm/s'}
              loading={loading}
              updatedAt={weather?.windSpeed.updatedAt}
            />
            <MetricCard
              title="風向"
              value={weather ? toDirectionLabel(weather.windDirection.value) : '-'}
              unit=""
              loading={loading}
              updatedAt={weather?.windDirection.updatedAt}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

type MetricCardProps = {
  title: string;
  value: string;
  unit: string;
  loading: boolean;
  updatedAt?: string;
};

function MetricCard({ title, value, unit, loading, updatedAt }: MetricCardProps) {
  return (
    <article className="card metric-card shadow-sm p-3 p-md-4">
      <h2 className="section-title">{title}</h2>
      <p className="metric-value mt-3 mb-1">{loading ? '読み込み中...' : value}</p>
      <p className="metric-unit mb-2">{unit}</p>
      <p className="metric-updated mb-0">更新時刻: {updatedAt ?? '-'}</p>
    </article>
  );
}

export default App;
