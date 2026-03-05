import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Alert, Spinner, Navbar, Nav } from 'react-bootstrap';
import LocationSelector from './LocationSelector';
import PeriodSelector from './PeriodSelector';
import WeatherCharts from './WeatherCharts';
import BlueprintViewer from './BlueprintViewer';
import WindWeatherCharts from './WindWeatherCharts';
import { fetchWeatherData, WeatherData } from '../services/weatherApi';
import { japanLocations } from '../data/japanLocations';
import { useQueryParams } from '../hooks/useQueryParams';

const WeatherDashboard: React.FC = () => {
  const { getParam, setParams } = useQueryParams();

  const initialPrefecture = getParam('location')?.split(',')[0] || '東京都';
  const initialMunicipality = getParam('location')?.split(',')[1] || '東京';
  const initialPeriod = getParam('period') || '48h';

  const [selectedPrefecture, setSelectedPrefecture] = useState(initialPrefecture);
  const [selectedMunicipality, setSelectedMunicipality] = useState(initialMunicipality);
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWeather = useCallback(async () => {
    const prefecture = japanLocations.find((p) => p.name === selectedPrefecture);
    const municipality = prefecture?.municipalities.find((m) => m.name === selectedMunicipality);
    if (!municipality) return;

    setLoading(true);
    setError(null);
    try {
      const days = selectedPeriod === '7d' ? 7 : 2;
      const data = await fetchWeatherData(municipality.lat, municipality.lon, days);
      setWeatherData(data);
    } catch (err) {
      setError('気象データの取得に失敗しました。しばらく後でもう一度お試しください。');
    } finally {
      setLoading(false);
    }
  }, [selectedPrefecture, selectedMunicipality, selectedPeriod]);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  const handlePrefectureChange = (prefecture: string) => {
    const newMunicipality =
      japanLocations.find((p) => p.name === prefecture)?.municipalities[0]?.name || '';
    setSelectedPrefecture(prefecture);
    setSelectedMunicipality(newMunicipality);
    setParams({ location: `${prefecture},${newMunicipality}`, period: selectedPeriod });
  };

  const handleMunicipalityChange = (municipality: string) => {
    setSelectedMunicipality(municipality);
    setParams({ location: `${selectedPrefecture},${municipality}`, period: selectedPeriod });
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    setParams({ location: `${selectedPrefecture},${selectedMunicipality}`, period });
  };

  return (
    <div className="min-vh-100" style={{ background: '#f0f4f8' }}>
      <Navbar bg="dark" variant="dark" className="shadow">
        <Container fluid>
          <Navbar.Brand className="fw-bold fs-5">
            ☁️ 気象ダッシュボード
          </Navbar.Brand>
          <Nav className="ms-auto">
            <Nav.Item className="text-light small d-flex align-items-center">
              データ: Open-Meteo API
            </Nav.Item>
          </Nav>
        </Container>
      </Navbar>

      <Container fluid className="py-3">
        <Row className="g-2 mb-3 align-items-center bg-white rounded shadow-sm p-2 mx-0">
          <Col xs={12} md="auto">
            <LocationSelector
              selectedPrefecture={selectedPrefecture}
              selectedMunicipality={selectedMunicipality}
              onPrefectureChange={handlePrefectureChange}
              onMunicipalityChange={handleMunicipalityChange}
            />
          </Col>
          <Col xs={12} md="auto">
            <PeriodSelector
              selectedPeriod={selectedPeriod}
              onPeriodChange={handlePeriodChange}
            />
          </Col>
          {selectedPrefecture && selectedMunicipality && (
            <Col xs={12} md="auto">
              <span className="badge bg-primary fs-6">
                📍 {selectedPrefecture} {selectedMunicipality}
              </span>
            </Col>
          )}
        </Row>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">気象データを取得中...</p>
          </div>
        )}

        {!loading && weatherData && (
          <Row className="g-3">
            <Col xs={12} lg={4}>
              <div className="mb-2">
                <h6 className="text-muted fw-bold text-uppercase small">
                  🌡️ 気温・湿度・降水量
                </h6>
              </div>
              <WeatherCharts data={weatherData} />
            </Col>
            <Col xs={12} lg={4}>
              <div className="mb-2">
                <h6 className="text-muted fw-bold text-uppercase small">
                  📐 図面ビューア
                </h6>
              </div>
              <BlueprintViewer />
            </Col>
            <Col xs={12} lg={4}>
              <div className="mb-2">
                <h6 className="text-muted fw-bold text-uppercase small">
                  🌬️ WBGT・風速・風向き
                </h6>
              </div>
              <WindWeatherCharts data={weatherData} />
            </Col>
          </Row>
        )}

        {!loading && !weatherData && !error && (
          <div className="text-center py-5 text-muted">
            <div style={{ fontSize: '4rem' }}>🌤️</div>
            <h4>場所を選択してください</h4>
            <p>都道府県と市区町村を選択すると気象データが表示されます</p>
          </div>
        )}
      </Container>

      <footer className="bg-dark text-light text-center py-2 small mt-auto">
        気象データ提供: <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="text-info">Open-Meteo</a>
        {' '} | 気象ダッシュボード © {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default WeatherDashboard;
