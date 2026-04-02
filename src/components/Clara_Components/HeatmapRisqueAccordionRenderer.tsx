/**
 * HeatmapRisqueAccordionRenderer.tsx
 * 
 * Composant React pour afficher une heatmap de criticité des risques
 * avec un menu accordéon interactif.
 * 
 * Format attendu de la réponse n8n:
 * [
 *   {
 *     "data": {
 *       "Etape mission - Cartographie": [
 *         { "table 1": { ... } },  // En-tête
 *         { "table 2": [ ... ] }   // Risques
 *       ]
 *     }
 *   }
 * ]
 */

import React, { useState } from 'react';
import './HeatmapRisqueAccordionRenderer.css';

interface RisqueItem {
  no: number;
  operationnel?: string;
  Risques: string;
  Probabilite: 'Élevé' | 'Moyen' | 'Faible';
  Impact: 'Élevé' | 'Moyen' | 'Faible';
  Criticite: 'Élevé' | 'Moyen' | 'Faible';
  'controle audit'?: string;
  [key: string]: any;
}

interface TableEntete {
  [key: string]: string;
}

interface HeatmapData {
  data: {
    [key: string]: Array<{
      [tableKey: string]: TableEntete | RisqueItem[];
    }>;
  };
}

interface HeatmapRisqueAccordionRendererProps {
  data: HeatmapData[];
}

const HeatmapRisqueAccordionRenderer: React.FC<HeatmapRisqueAccordionRendererProps> = ({ data }) => {
  const [activeSection, setActiveSection] = useState<number | null>(0);

  // Extraire les données
  const mainData = data[0]?.data;
  if (!mainData) {
    return <div className="heatmap-error">Aucune donnée disponible</div>;
  }

  const mainKey = Object.keys(mainData)[0];
  const tables = mainData[mainKey];

  if (!Array.isArray(tables) || tables.length < 2) {
    return <div className="heatmap-error">Format de données invalide</div>;
  }

  // Table 1: En-tête
  const table1Key = Object.keys(tables[0])[0];
  const entete: TableEntete = tables[0][table1Key] as TableEntete;

  // Table 2: Risques
  const table2Key = Object.keys(tables[1])[0];
  const risques: RisqueItem[] = tables[1][table2Key] as RisqueItem[];

  // Calculer la répartition des risques par criticité
  const repartitionRisques = calculerRepartitionRisques(risques);

  const toggleSection = (index: number) => {
    setActiveSection(activeSection === index ? null : index);
  };

  return (
    <div className="heatmap-risque-container">
      {/* Section 1: Page de couverture */}
      <div className="heatmap-accordion-section">
        <button
          className={`heatmap-accordion-header ${activeSection === 0 ? 'active' : ''}`}
          onClick={() => toggleSection(0)}
        >
          <span className="heatmap-accordion-icon">
            {activeSection === 0 ? '▼' : '▶'}
          </span>
          <span className="heatmap-accordion-title">
            📋 Page de Couverture - Cartographie des Risques
          </span>
        </button>
        {activeSection === 0 && (
          <div className="heatmap-accordion-content">
            <table className="heatmap-entete-table">
              <tbody>
                {Object.entries(entete).map(([key, value]) => (
                  <tr key={key}>
                    <th>{formatKey(key)}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Heatmap de criticité */}
      <div className="heatmap-accordion-section">
        <button
          className={`heatmap-accordion-header ${activeSection === 1 ? 'active' : ''}`}
          onClick={() => toggleSection(1)}
        >
          <span className="heatmap-accordion-icon">
            {activeSection === 1 ? '▼' : '▶'}
          </span>
          <span className="heatmap-accordion-title">
            🔥 Heatmap de Criticité des Risques
          </span>
        </button>
        {activeSection === 1 && (
          <div className="heatmap-accordion-content">
            <HeatmapGrid repartition={repartitionRisques} />
          </div>
        )}
      </div>

      {/* Section 3: Tableau détaillé des risques */}
      <div className="heatmap-accordion-section">
        <button
          className={`heatmap-accordion-header ${activeSection === 2 ? 'active' : ''}`}
          onClick={() => toggleSection(2)}
        >
          <span className="heatmap-accordion-icon">
            {activeSection === 2 ? '▼' : '▶'}
          </span>
          <span className="heatmap-accordion-title">
            📊 Tableau Détaillé des Risques ({risques.length} risques)
          </span>
        </button>
        {activeSection === 2 && (
          <div className="heatmap-accordion-content">
            <TableauRisques risques={risques} />
          </div>
        )}
      </div>
    </div>
  );
};

// Composant Heatmap Grid
interface HeatmapGridProps {
  repartition: {
    [key: string]: RisqueItem[];
  };
}

const HeatmapGrid: React.FC<HeatmapGridProps> = ({ repartition }) => {
  const [selectedCell, setSelectedCell] = useState<string | null>(null);

  const getCellClass = (probabilite: string, impact: string): string => {
    const key = `${probabilite}-${impact}`;
    const criticite = getCriticite(probabilite, impact);
    return `heatmap-cell heatmap-cell-${criticite.toLowerCase()}`;
  };

  const getCriticite = (probabilite: string, impact: string): string => {
    if (
      (probabilite === 'Élevé' && impact === 'Élevé') ||
      (probabilite === 'Élevé' && impact === 'Moyen') ||
      (probabilite === 'Moyen' && impact === 'Élevé')
    ) {
      return 'Élevé';
    } else if (
      (probabilite === 'Moyen' && impact === 'Moyen') ||
      (probabilite === 'Faible' && impact === 'Élevé') ||
      (probabilite === 'Élevé' && impact === 'Faible')
    ) {
      return 'Moyen';
    } else {
      return 'Faible';
    }
  };

  const handleCellClick = (probabilite: string, impact: string) => {
    const key = `${probabilite}-${impact}`;
    setSelectedCell(selectedCell === key ? null : key);
  };

  const renderCell = (probabilite: string, impact: string) => {
    const key = `${probabilite}-${impact}`;
    const risquesInCell = repartition[key] || [];
    const criticite = getCriticite(probabilite, impact);

    return (
      <td
        key={key}
        className={getCellClass(probabilite, impact)}
        onClick={() => handleCellClick(probabilite, impact)}
        style={{ cursor: 'pointer' }}
      >
        <div className="heatmap-cell-content">
          <div className="heatmap-cell-count">{risquesInCell.length}</div>
          <div className="heatmap-cell-label">{criticite}</div>
        </div>
        {selectedCell === key && risquesInCell.length > 0 && (
          <div className="heatmap-cell-details">
            <strong>Risques:</strong>
            <ul>
              {risquesInCell.map((risque) => (
                <li key={risque.no}>
                  R{risque.no}: {risque.Risques.substring(0, 50)}...
                </li>
              ))}
            </ul>
          </div>
        )}
      </td>
    );
  };

  return (
    <div className="heatmap-grid-container">
      <table className="heatmap-grid">
        <thead>
          <tr>
            <th className="heatmap-header-corner">Probabilité d'occurrence</th>
            <th className="heatmap-header-impact">Faible</th>
            <th className="heatmap-header-impact">Modérée</th>
            <th className="heatmap-header-impact">Forte</th>
            <th className="heatmap-header-impact">Élevée</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th className="heatmap-header-prob">Élevé</th>
            {renderCell('Élevé', 'Faible')}
            {renderCell('Élevé', 'Moyen')}
            {renderCell('Élevé', 'Élevé')}
            {renderCell('Élevé', 'Élevé')}
          </tr>
          <tr>
            <th className="heatmap-header-prob">Fort</th>
            {renderCell('Moyen', 'Faible')}
            {renderCell('Moyen', 'Moyen')}
            {renderCell('Moyen', 'Élevé')}
            {renderCell('Moyen', 'Élevé')}
          </tr>
          <tr>
            <th className="heatmap-header-prob">Modéré</th>
            {renderCell('Faible', 'Faible')}
            {renderCell('Faible', 'Moyen')}
            {renderCell('Faible', 'Élevé')}
            {renderCell('Faible', 'Élevé')}
          </tr>
          <tr>
            <th className="heatmap-header-prob">Faible</th>
            {renderCell('Faible', 'Faible')}
            {renderCell('Faible', 'Faible')}
            {renderCell('Faible', 'Moyen')}
            {renderCell('Faible', 'Élevé')}
          </tr>
        </tbody>
      </table>
      <div className="heatmap-legend">
        <div className="heatmap-legend-item">
          <span className="heatmap-legend-color heatmap-legend-faible"></span>
          <span>Faible</span>
        </div>
        <div className="heatmap-legend-item">
          <span className="heatmap-legend-color heatmap-legend-moyen"></span>
          <span>Moyen</span>
        </div>
        <div className="heatmap-legend-item">
          <span className="heatmap-legend-color heatmap-legend-eleve"></span>
          <span>Élevé</span>
        </div>
      </div>
    </div>
  );
};

// Composant Tableau des Risques
interface TableauRisquesProps {
  risques: RisqueItem[];
}

const TableauRisques: React.FC<TableauRisquesProps> = ({ risques }) => {
  return (
    <div className="heatmap-table-container">
      <table className="heatmap-risques-table">
        <thead>
          <tr>
            <th>N°</th>
            <th>Opérationnel</th>
            <th>Risques</th>
            <th>Probabilité</th>
            <th>Impact</th>
            <th>Criticité</th>
            <th>Contrôle Audit</th>
          </tr>
        </thead>
        <tbody>
          {risques.map((risque) => (
            <tr key={risque.no} className={`risque-row risque-${risque.Criticite.toLowerCase()}`}>
              <td>{risque.no}</td>
              <td>{risque.operationnel || '-'}</td>
              <td>{risque.Risques}</td>
              <td>
                <span className={`badge badge-${risque.Probabilite.toLowerCase()}`}>
                  {risque.Probabilite}
                </span>
              </td>
              <td>
                <span className={`badge badge-${risque.Impact.toLowerCase()}`}>
                  {risque.Impact}
                </span>
              </td>
              <td>
                <span className={`badge badge-${risque.Criticite.toLowerCase()}`}>
                  {risque.Criticite}
                </span>
              </td>
              <td>{risque['controle audit'] || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Fonction utilitaire pour calculer la répartition des risques
function calculerRepartitionRisques(risques: RisqueItem[]): { [key: string]: RisqueItem[] } {
  const repartition: { [key: string]: RisqueItem[] } = {};

  risques.forEach((risque) => {
    const key = `${risque.Probabilite}-${risque.Impact}`;
    if (!repartition[key]) {
      repartition[key] = [];
    }
    repartition[key].push(risque);
  });

  return repartition;
}

// Fonction utilitaire pour formater les clés
function formatKey(key: string): string {
  return key
    .split(/(?=[A-Z])/)
    .join(' ')
    .replace(/^./, (str) => str.toUpperCase());
}

export default HeatmapRisqueAccordionRenderer;
