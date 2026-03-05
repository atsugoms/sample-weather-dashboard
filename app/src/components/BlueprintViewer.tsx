import React, { useState } from 'react';
import { Card } from 'react-bootstrap';

const BlueprintViewer: React.FC = () => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
  };

  return (
    <Card className="shadow-sm h-100">
      <Card.Header className="bg-secondary text-white fw-bold py-2">
        📐 図面ビューア
      </Card.Header>
      <Card.Body className="p-2 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '500px' }}>
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            title="PDF図面"
            width="100%"
            style={{ minHeight: '460px', border: 'none' }}
          />
        ) : (
          <div
            className="border border-2 border-dashed border-secondary rounded d-flex flex-column align-items-center justify-content-center w-100 h-100"
            style={{ minHeight: '460px', background: '#f8f9fa' }}
          >
            <div className="text-center text-muted">
              <div style={{ fontSize: '4rem' }}>📄</div>
              <h5 className="mt-3">PDF 図面ビューア</h5>
              <p className="small">PDFファイルをここにドロップするか、<br />下のボタンからアップロードしてください</p>
              <label className="btn btn-outline-secondary btn-sm mt-2">
                ファイルを選択
                <input type="file" accept=".pdf" className="d-none" onChange={handleFileChange} />
              </label>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default BlueprintViewer;
