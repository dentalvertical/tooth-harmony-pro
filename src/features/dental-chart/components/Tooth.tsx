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

const UPPER_WIDTHS: Record<number, number> = {
  1: 65,
  2: 72,
  3: 77,
  4: 56,
  5: 56,
  6: 55,
  7: 48,
  8: 71,
  9: 72,
  10: 47,
  11: 55,
  12: 55,
  13: 56,
  14: 78,
  15: 73,
  16: 68,
};

const LOWER_WIDTHS_BY_INDEX: Record<number, number> = {
  1: 69,
  2: 81,
  3: 82,
  4: 58,
  5: 58,
  6: 56,
  7: 50,
  8: 47,
  9: 46,
  10: 50,
  11: 56,
  12: 58,
  13: 58,
  14: 82,
  15: 83,
  16: 71,
};

const UPPER_HEIGHT = 217;
const LOWER_HEIGHT = 220;

function getToothAsset(number: number, isUpper: boolean, changed: boolean) {
  const prefix = changed ? "pink" : "white";

  if (isUpper) {
    return `/teeth/${prefix}_tooth_03_tooth_${String(number).padStart(2, "0")}.png`;
  }

  const lowerIndex = LOWER_TEETH.indexOf(number) + 1;
  return `/teeth/${prefix}_tooth_04_tooth_${String(lowerIndex).padStart(2, "0")}.png`;
}

function getToothDisplayWidth(number: number, isUpper: boolean, imageHeight: number) {
  if (isUpper) {
    return (UPPER_WIDTHS[number] / UPPER_HEIGHT) * imageHeight;
  }

  const lowerIndex = LOWER_TEETH.indexOf(number) + 1;
  return ((LOWER_WIDTHS_BY_INDEX[lowerIndex] || 60) / LOWER_HEIGHT) * imageHeight;
}

export function Tooth({ number, isUpper, record, selected, onClick, alignBottom = false }: ToothProps) {
  const changed = hasToothChanges(record);
  const asset = getToothAsset(number, isUpper, changed);
  const imageHeight = 118;
  const imageWidth = getToothDisplayWidth(number, isUpper, imageHeight);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-none flex-col items-center rounded-xl py-1 transition-all",
        alignBottom ? "justify-end" : "justify-start",
        selected ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/50",
      )}
      style={{ width: `${Math.round(imageWidth)}px` }}
    >
      {isUpper ? (
        <span className="mb-1 text-[10px] font-medium leading-none text-muted-foreground md:text-[11px]">
          {number}
        </span>
      ) : null}

      <img
        src={asset}
        alt={`Tooth ${number}`}
        className="w-auto object-contain transition-transform duration-200 group-hover:scale-[1.03]"
        style={{ height: `${imageHeight}px` }}
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
