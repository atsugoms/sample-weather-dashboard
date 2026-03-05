import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { WeatherData } from '../services/weatherApi';

interface WindWeatherChartsProps {
  data: WeatherData;
}

function getWindDirectionLabel(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

function getWBGTLevel(wbgt: number): { label: string; variant: string } {
  if (wbgt < 21) return { label: 'ほぼ安全', variant: 'success' };
  if (wbgt < 25) return { label: '注意', variant: 'info' };
  if (wbgt < 28) return { label: '警戒', variant: 'warning' };
  if (wbgt < 31) return { label: '厳重警戒', variant: 'orange' };
  return { label: '危険', variant: 'danger' };
}

function formatTime(timeStr: string): string {
  const d = new Date(timeStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
}

const WindWeatherCharts: React.FC<WindWeatherChartsProps> = ({ data }) => {
  const step = data.time.length > 48 ? 6 : 3;

  const chartData = data.time
    .filter((_, i) => i % step === 0)
    .map((t, i) => {
      const idx = i * step;
      return {
        time: formatTime(t),
        wbgt: Math.round(data.wbgt[idx] * 10) / 10,
        windspeed: Math.round(data.windspeed_10m[idx] * 10) / 10,
        winddirection: data.winddirection_10m[idx],
        windLabel: getWindDirectionLabel(data.winddirection_10m[idx]),
      };
    });

  const latestWBGT = data.wbgt.length > 0 ? data.wbgt[0] : 0;
  const wbgtLevel = getWBGTLevel(latestWBGT);

  return (
    <div className="d-flex flex-column gap-3">
      <Card className="shadow-sm">
        <Card.Header className="bg-warning text-dark fw-bold py-2 d-flex justify-content-between align-items-center">
          <span>🌡️ WBGT 暑さ指数</span>
          <Badge bg={wbgtLevel.variant === 'orange' ? 'warning' : wbgtLevel.variant} text={wbgtLevel.variant === 'warning' || wbgtLevel.variant === 'orange' ? 'dark' : undefined}>
            {wbgtLevel.label}
          </Badge>
        </Card.Header>
        <Card.Body className="p-2">
          <div className="text-center mb-2">
            <span className="fs-4 fw-bold text-warning">{Math.round(latestWBGT * 10) / 10}°C</span>
            <span className="text-muted small ms-2">現在</span>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} unit="°C" />
              <Tooltip formatter={(v: number | string | undefined) => [`${v}°C`, 'WBGT']} />
              <Line type="monotone" dataKey="wbgt" stroke="#ffc107" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Header className="bg-success text-white fw-bold py-2">
          💨 風速 (m/s)
        </Card.Header>
        <Card.Body className="p-2">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} unit="m/s" />
              <Tooltip formatter={(v: number | string | undefined) => [`${v}m/s`, '風速']} />
              <Bar dataKey="windspeed" fill="#198754" />
            </BarChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Header className="bg-dark text-white fw-bold py-2">
          🧭 風向き
        </Card.Header>
        <Card.Body className="p-2">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} unit="°" domain={[0, 360]} ticks={[0, 90, 180, 270, 360]} />
              <Tooltip
                formatter={(v: number | string | undefined) => [
                  `${v}° (${getWindDirectionLabel(Number(v))})`,
                  '風向き',
                ]}
              />
              <Line type="monotone" dataKey="winddirection" stroke="#212529" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="d-flex flex-wrap gap-1 mt-2 justify-content-center">
            {chartData.slice(-8).map((d, i) => (
              <Badge key={i} bg="secondary" className="small">
                {d.windLabel}
              </Badge>
            ))}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default WindWeatherCharts;
