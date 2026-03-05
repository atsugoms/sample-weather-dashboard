import axios from 'axios';

export interface WeatherData {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  precipitation: number[];
  windspeed_10m: number[];
  winddirection_10m: number[];
  wbgt: number[];
}

function calculateWBGT(temp: number, humidity: number): number {
  const wetBulbTemp =
    temp * Math.atan(0.151977 * Math.sqrt(humidity + 8.313659)) +
    Math.atan(temp + humidity) -
    Math.atan(humidity - 1.676331) +
    0.00391838 * Math.pow(humidity, 1.5) * Math.atan(0.023101 * humidity) -
    4.686035;
  return 0.7 * wetBulbTemp + 0.3 * temp;
}

export async function fetchWeatherData(
  lat: number,
  lon: number,
  days: number
): Promise<WeatherData> {
  const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
    params: {
      latitude: lat,
      longitude: lon,
      hourly:
        'temperature_2m,relative_humidity_2m,precipitation,windspeed_10m,winddirection_10m',
      timezone: 'Asia/Tokyo',
      forecast_days: days,
    },
  });

  const hourly = response.data.hourly;
  const wbgt = hourly.temperature_2m.map((t: number, i: number) =>
    calculateWBGT(t, hourly.relative_humidity_2m[i])
  );

  return {
    time: hourly.time,
    temperature_2m: hourly.temperature_2m,
    relative_humidity_2m: hourly.relative_humidity_2m,
    precipitation: hourly.precipitation,
    windspeed_10m: hourly.windspeed_10m,
    winddirection_10m: hourly.winddirection_10m,
    wbgt,
  };
}
