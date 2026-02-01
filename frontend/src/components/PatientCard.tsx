import { cn, getRiskColor } from "../lib/utils";
import type { Patient } from "../types";

interface PatientCardProps {
  patient: Patient;
  onClick?: () => void;
  selected?: boolean;
}

export function PatientCard({ patient, onClick, selected }: PatientCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "w-full py-2 px-3 rounded-lg cursor-pointer transition-all duration-200",
        selected
          ? "bg-white/20 shadow-md"
          : "hover:bg-white/10 hover:shadow-sm"
      )}
    >
      <div className="flex items-center gap-4 m-auto">
        {/* Avatar */}
        <div className="w-14 h-14 flex items-center justify-center text-lg font-semibold bg-slate-200 rounded-full">
          <span className="text-slate-800">{patient.name.charAt(0)}</span>
        </div>

        {/* Info */}
        <div className="flex-1 py-2">
          <h3 className={"font-medium text-white truncate text-md"}>
            {patient.name}
          </h3>
          <p className={"text-sm text-white/50"}>Age {patient.age}</p>
        </div>

        {/* Risk badge */}
        <span
          className={cn(
            "px-3 py-1 rounded-full text-sm font-medium capitalize whitespace-nowrap mt-2 mr-2",
            getRiskColor(patient.riskLevel),
          )}
        >
          {patient.riskLevel}
        </span>
      </div>

      {/* Conditions */}
      {/* {patient.conditions.length > 0 && ( */}
      {/*   <div className="flex flex-wrap gap-2 pl-2 pb-2"> */}
      {/*     {patient.conditions.slice(0, 3).map((condition, i) => ( */}
      {/*       <span */}
      {/*         key={i} */}
      {/*         className={cn( */}
      {/*           "px-3 py-1 text-xs rounded-full font-medium bg-slate-100 text-slate-600", */}
      {/*         )} */}
      {/*       > */}
      {/*         {condition} */}
      {/*       </span> */}
      {/*     ))} */}
      {/*     {patient.conditions.length > 3 && ( */}
      {/*       <span */}
      {/*         className={cn( */}
      {/*           "px-3 py-1 text-xs rounded-full font-medium", */}
      {/*           selected */}
      {/*             ? "bg-white bg-opacity-10 text-accent-secondary-text" */}
      {/*             : "bg-slate-100 text-slate-600", */}
      {/*         )} */}
      {/*       > */}
      {/*         +{patient.conditions.length - 3} more */}
      {/*       </span> */}
      {/*     )} */}
      {/*   </div> */}
      {/* )} */}
    </div>
  );
}
