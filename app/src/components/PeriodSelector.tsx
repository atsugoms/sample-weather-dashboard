import React from 'react';
import { Form, Row, Col } from 'react-bootstrap';

interface PeriodSelectorProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
}) => {
  return (
    <Row className="g-2 align-items-center">
      <Col xs="auto">
        <Form.Label className="fw-bold mb-0">期間：</Form.Label>
      </Col>
      <Col xs="auto">
        <Form.Select
          value={selectedPeriod}
          onChange={(e) => onPeriodChange(e.target.value)}
          size="sm"
        >
          <option value="48h">48時間</option>
          <option value="7d">7日</option>
        </Form.Select>
      </Col>
    </Row>
  );
};

export default PeriodSelector;
