import { cn } from "@/lib/utils";
import { hasToothChanges, LOWER_TEETH } from "@/features/dental-chart/data";
import type { ToothRecord } from "../types";

interface ToothProps {
  number: number;
  isUpper: boolean;
  record: ToothRecord;
  selected: boolean;
  onClick: () => void;
  alignBottom?: boolean;
}

function getToothAsset(number: number, isUpper: boolean, changed: boolean) {
  const prefix = changed ? "pink" : "white";

  if (isUpper) {
    return `/teeth/${prefix}_tooth_03_tooth_${String(number).padStart(2, "0")}.png`;
  }

  const lowerIndex = LOWER_TEETH.indexOf(number) + 1;
  return `/teeth/${prefix}_tooth_04_tooth_${String(lowerIndex).padStart(2, "0")}.png`;
}

export function Tooth({ number, isUpper, record, selected, onClick, alignBottom = false }: ToothProps) {
  const changed = hasToothChanges(record);
  const asset = getToothAsset(number, isUpper, changed);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-none flex-col items-center rounded-xl px-[1px] py-1 transition-all",
        alignBottom ? "justify-end" : "justify-start",
        selected ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/50",
      )}
    >
      {isUpper ? (
        <span className="mb-1 text-[10px] font-medium leading-none text-muted-foreground md:text-[11px]">
          {number}
        </span>
      ) : null}

      <img
        src={asset}
        alt={`Tooth ${number}`}
        className="h-[88px] w-auto object-contain transition-transform duration-200 group-hover:scale-[1.03] md:h-[118px]"
        draggable={false}
      />

      {!isUpper ? (
        <span className="mt-1 text-[10px] font-medium leading-none text-muted-foreground md:text-[11px]">
          {number}
        </span>
      ) : null}
    </button>
  );
}
