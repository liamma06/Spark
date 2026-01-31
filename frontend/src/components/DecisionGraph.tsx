import { cn } from '../lib/utils';
import type { DecisionGraph as DecisionGraphType, DecisionNode } from '../types';

interface DecisionGraphProps {
  graph: DecisionGraphType;
}

function NodeCard({ node }: { node: DecisionNode }) {
  const getNodeStyle = () => {
    switch (node.type) {
      case 'symptom':
        return 'border-blue-300 bg-blue-50 text-blue-800';
      case 'factor':
        return node.riskContribution === 'high'
          ? 'border-red-300 bg-red-50 text-red-800'
          : node.riskContribution === 'medium'
          ? 'border-amber-300 bg-amber-50 text-amber-800'
          : 'border-green-300 bg-green-50 text-green-800';
      case 'recommendation':
        return 'border-purple-300 bg-purple-50 text-purple-800';
      default:
        return 'border-slate-300 bg-slate-50 text-slate-800';
    }
  };

  const getIcon = () => {
    switch (node.type) {
      case 'symptom':
        return '🩺';
      case 'factor':
        return '⚡';
      case 'recommendation':
        return '💡';
      default:
        return '📌';
    }
  };

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 text-center min-w-[140px]',
        getNodeStyle()
      )}
    >
      <span className="text-lg">{getIcon()}</span>
      <p className="font-medium text-sm mt-1">{node.label}</p>
      {node.riskContribution && (
        <span className="text-xs opacity-75 capitalize">
          {node.riskContribution} risk
        </span>
      )}
    </div>
  );
}

export function DecisionGraph({ graph }: DecisionGraphProps) {
  // Group nodes by type for layout
  const symptoms = graph.nodes.filter((n) => n.type === 'symptom');
  const factors = graph.nodes.filter((n) => n.type === 'factor');
  const recommendations = graph.nodes.filter((n) => n.type === 'recommendation');

  if (graph.nodes.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Decision Graph</h2>
        <p className="text-slate-400 text-center py-8">
          No decision data available yet
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-2">Decision Graph</h2>
      <p className="text-sm text-slate-500 mb-6">
        How we arrived at the risk assessment
      </p>

      {/* Simple horizontal flow layout */}
      <div className="flex items-start justify-between gap-4 overflow-x-auto pb-4">
        {/* Symptoms column */}
        <div className="flex flex-col gap-3 items-center">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Reported Symptoms
          </h3>
          {symptoms.map((node) => (
            <NodeCard key={node.id} node={node} />
          ))}
        </div>

        {/* Arrow */}
        <div className="flex items-center text-slate-300 text-2xl pt-8">→</div>

        {/* Risk factors column */}
        <div className="flex flex-col gap-3 items-center">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Risk Factors
          </h3>
          {factors.map((node) => (
            <NodeCard key={node.id} node={node} />
          ))}
        </div>

        {/* Arrow */}
        <div className="flex items-center text-slate-300 text-2xl pt-8">→</div>

        {/* Recommendations column */}
        <div className="flex flex-col gap-3 items-center">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Recommendations
          </h3>
          {recommendations.map((node) => (
            <NodeCard key={node.id} node={node} />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-400" />
          <span className="text-slate-600">Low Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-400" />
          <span className="text-slate-600">Medium Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-400" />
          <span className="text-slate-600">High Risk</span>
        </div>
      </div>
    </div>
  );
}
