import { useState, useEffect, useCallback } from 'react';
import type { SimulationState, OptionalBlock, ScenariosConfig } from './types';
import { DEFAULT_STATE } from './data/defaults';
import { DEMO_STATE } from './data/demo';
import { saveState, loadState, clearState } from './utils/storage';
import { calculate } from './engine/calculator';
import { buildReportModel } from './engine/reportModel';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Step1Profile from './components/Wizard/Step1Profile';
import Step2Scope from './components/Wizard/Step2Scope';
import Step3Incidents from './components/Wizard/Step3Incidents';
import Step4Blocks from './components/Wizard/Step4Blocks';
import Step5InstanaCosts from './components/Wizard/Step5InstanaCosts';
import Dashboard from './components/Dashboard/Dashboard';
import './styles/main.css';

const TOTAL_STEPS = 6;

export default function App() {
  const [state, setState] = useState<SimulationState>(() => loadState() ?? DEFAULT_STATE);
  const [step, setStep] = useState(0);
  const [activeBlock, setActiveBlock] = useState<OptionalBlock | null>(null);

  // Persist on every change
  useEffect(() => { saveState(state); }, [state]);

  const results = calculate(state);
  const model = buildReportModel(state, results);

  const update = useCallback((s: SimulationState) => setState(s), []);
  const updateScenarios = useCallback(
    (cfg: ScenariosConfig) => setState(s => ({ ...s, scenariosConfig: cfg })),
    [],
  );

  const loadDemo = () => {
    clearState();
    setState(DEMO_STATE);
    setStep(5);
  };

  const reset = () => {
    if (window.confirm('¿Limpiar todos los datos? Esta acción no se puede deshacer.')) {
      clearState();
      setState(DEFAULT_STATE);
      setStep(0);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <Step1Profile
            data={state.profile}
            onChange={p => update({ ...state, profile: p })}
          />
        );
      case 1:
        return (
          <Step2Scope
            data={state.scope}
            onChange={s => update({ ...state, scope: s })}
          />
        );
      case 2:
        return (
          <Step3Incidents
            data={state.incidents}
            onChange={i => update({ ...state, incidents: i })}
            warRoom={results.warRoom}
            currency={state.profile.currency}
            customCurrency={state.profile.customCurrency}
            industry={state.profile.industry}
          />
        );
      case 3:
        return (
          <Step4Blocks
            state={state}
            onChange={update}
            initialBlock={activeBlock}
          />
        );
      case 4:
        return (
          <Step5InstanaCosts
            data={state.instanaCosts}
            onChange={c => update({ ...state, instanaCosts: c })}
            currency={state.profile.currency}
            customCurrency={state.profile.customCurrency}
          />
        );
      case 5:
        return <Dashboard model={model} onScenariosChange={updateScenarios} />;
      default:
        return null;
    }
  };

  const canGoNext = step < TOTAL_STEPS - 1;
  const canGoPrev = step > 0;

  return (
    <div className="app-layout">
      <Sidebar
        currentStep={step}
        onStep={setStep}
        activeBlocks={state.blocks.activeBlocks}
        currentBlock={activeBlock}
        onBlock={b => { setActiveBlock(b); setStep(3); }}
      />

      <div className="main-content">
        <Header
          step={step}
          clientName={state.profile.clientName}
          confidence={step === 5 ? results.confidenceLevel : undefined}
          dataCompleteness={step === 5 ? results.dataCompleteness : undefined}
          onLoadDemo={loadDemo}
          onReset={reset}
        />

        <div className="content-area">
          {renderStep()}
        </div>

        <div className="nav-footer">
          <div style={{ display: 'flex', gap: 8 }}>
            {canGoPrev && (
              <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>
                ← Anterior
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--ibm-text-secondary)' }}>
              Paso {step + 1} de {TOTAL_STEPS}
            </span>
            {step < 5 && (
              <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>
                {step === 4 ? 'Ver Dashboard →' : 'Siguiente →'}
              </button>
            )}
            {step === 5 && (
              <button className="btn btn-ghost" onClick={() => setStep(0)}>
                ← Volver al inicio
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
