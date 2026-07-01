import { useState } from 'react';
import type { ReportModel } from '../../engine/reportModel';

interface Props {
  model: ReportModel;
}

export default function ExportButtons({ model }: Props) {
  const [loadingXlsx, setLoadingXlsx] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const handleExcel = async () => {
    setLoadingXlsx(true);
    try {
      const { exportToExcel } = await import('../../export/excel');
      exportToExcel(model);
    } finally {
      setLoadingXlsx(false);
    }
  };

  const handlePDF = async () => {
    setLoadingPdf(true);
    try {
      const { exportToPDF } = await import('../../export/pdf');
      exportToPDF(model);
    } finally {
      setLoadingPdf(false);
    }
  };

  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--ibm-text-secondary)', marginBottom: 12 }}>
        Exporta la simulación para compartir con el cliente o equipo interno.
        Los archivos incluyen todos los datos, supuestos y resultados detallados.
      </p>
      <div className="export-area">
        <button
          className="btn btn-primary"
          onClick={handleExcel}
          disabled={loadingXlsx}
        >
          {loadingXlsx ? '⏳' : '📊'} Exportar Excel (.xlsx)
        </button>
        <button
          className="btn btn-secondary"
          onClick={handlePDF}
          disabled={loadingPdf}
        >
          {loadingPdf ? '⏳' : '📄'} Exportar PDF
        </button>
        <span style={{ fontSize: 11, color: 'var(--ibm-text-secondary)' }}>
          Excel: 8 hojas · PDF: portada + resumen + gráficos ejecutivos + scores + interpretación + recomendación
        </span>
      </div>
    </div>
  );
}
