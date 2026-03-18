import type { ToothData, ToothStatus } from '../types';

const statusColors: Record<ToothStatus, string> = {
  healthy: "fill-tooth-healthy",
  cavity: "fill-tooth-cavity",
  filled: "fill-tooth-filled",
  missing: "fill-tooth-missing",
  implant: "fill-tooth-implant",
};

interface ToothProps {
  data: ToothData;
  x: number;
  y: number;
  selected: boolean;
  onClick: () => void;
}

export function Tooth({ data, x, y, selected, onClick }: ToothProps) {
  return (
    <g onClick={onClick} className="cursor-pointer" role="button" tabIndex={0}>
      <rect
        x={x}
        y={y}
        width={36}
        height={44}
        rx={6}
        className={`${statusColors[data.status]} ${
          selected ? "stroke-primary stroke-[3]" : "stroke-border stroke-[1.5]"
        } transition-all hover:opacity-80`}
      />
      <text
        x={x + 18}
        y={y + 27}
        textAnchor="middle"
        className="fill-foreground text-xs font-medium pointer-events-none"
        style={{ fontSize: "11px" }}
      >
        {data.id}
      </text>
    </g>
  );
}
