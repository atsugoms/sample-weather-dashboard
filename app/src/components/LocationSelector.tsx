import React from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import { japanLocations, Prefecture, Municipality } from '../data/japanLocations';

interface LocationSelectorProps {
  selectedPrefecture: string;
  selectedMunicipality: string;
  onPrefectureChange: (prefecture: string) => void;
  onMunicipalityChange: (municipality: string) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedPrefecture,
  selectedMunicipality,
  onPrefectureChange,
  onMunicipalityChange,
}) => {
  const prefecture: Prefecture | undefined = japanLocations.find(
    (p) => p.name === selectedPrefecture
  );
  const municipalities: Municipality[] = prefecture ? prefecture.municipalities : [];

  return (
    <Row className="g-2 align-items-center">
      <Col xs="auto">
        <Form.Label className="fw-bold mb-0">場所：</Form.Label>
      </Col>
      <Col xs="auto">
        <Form.Select
          value={selectedPrefecture}
          onChange={(e) => onPrefectureChange(e.target.value)}
          size="sm"
        >
          <option value="">都道府県を選択</option>
          {japanLocations.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </Form.Select>
      </Col>
      <Col xs="auto">
        <Form.Select
          value={selectedMunicipality}
          onChange={(e) => onMunicipalityChange(e.target.value)}
          size="sm"
          disabled={!selectedPrefecture}
        >
          <option value="">市区町村を選択</option>
          {municipalities.map((m) => (
            <option key={m.name} value={m.name}>
              {m.name}
            </option>
          ))}
        </Form.Select>
      </Col>
    </Row>
  );
};

export default LocationSelector;
