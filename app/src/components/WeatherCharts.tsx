import React from 'react';
import { Card } from 'react-bootstrap';
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

interface WeatherChartsProps {
  data: WeatherData;
}

function formatTime(timeStr: string): string {
  const d = new Date(timeStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
}

const WeatherCharts: React.FC<WeatherChartsProps> = ({ data }) => {
  const chartData = data.time.map((t, i) => ({
    time: formatTime(t),
    temperature: Math.round(data.temperature_2m[i] * 10) / 10,
    humidity: Math.round(data.relative_humidity_2m[i]),
    rainfall: Math.round(data.precipitation[i] * 10) / 10,
  }));

  const step = data.time.length > 48 ? 6 : 3;
  const sampledData = chartData.filter((_, i) => i % step === 0);

  return (
    <div className="d-flex flex-column gap-3">
      <Card className="shadow-sm">
        <Card.Header className="bg-danger text-white fw-bold py-2">
          🌡️ 気温 (°C)
        </Card.Header>
        <Card.Body className="p-2">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={sampledData} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} unit="°C" />
              <Tooltip formatter={(v: number | string | undefined) => [`${v}°C`, '気温']} />
              <Line type="monotone" dataKey="temperature" stroke="#dc3545" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Header className="bg-info text-white fw-bold py-2">
          💧 湿度 (%)
        </Card.Header>
        <Card.Body className="p-2">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={sampledData} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
              <Tooltip formatter={(v: number | string | undefined) => [`${v}%`, '湿度']} />
              <Line type="monotone" dataKey="humidity" stroke="#0dcaf0" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white fw-bold py-2">
          🌧️ 降水量 (mm)
        </Card.Header>
        <Card.Body className="p-2">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={sampledData} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} unit="mm" />
              <Tooltip formatter={(v: number | string | undefined) => [`${v}mm`, '降水量']} />
              <Bar dataKey="rainfall" fill="#0d6efd" />
            </BarChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>
    </div>
  );
};

export default WeatherCharts;
