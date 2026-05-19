import React from 'react';
import SyncActivityChart from '../components/SyncActivityChart';
import EntitySyncHeatmap from '../components/EntitySyncHeatmap';
import SyncReportPDF from '../components/SyncReportPDF';
import MappingRulesEditor from '../components/MappingRulesEditor';
import { FiLayers } from 'react-icons/fi';

export default function CustomViewsPage() {
  return (
    <div className="dashboard" style={{ padding: 24 }}>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FiLayers size={26} color="#0078D4" />
          <div>
            <h1 style={{ margin: 0 }}>Dynamics Views</h1>
            <p className="page-subtitle" style={{ margin: '4px 0 0', color: '#666', fontSize: 13 }}>
              Custom Microsoft Dynamics 365 sync visualizations &amp; integration mapping
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(520px, 1fr))', gap: 16, marginBottom: 16 }}>
        <SyncActivityChart />
        <EntitySyncHeatmap />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        <SyncReportPDF />
        <MappingRulesEditor />
      </div>
    </div>
  );
}
