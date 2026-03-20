import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { hasToothChanges } from "@/features/dental-chart/data";
import type { ToothRecord } from "../types";

interface ToothProps {
  number: number;
  isUpper: boolean;
  record: ToothRecord;
  selected: boolean;
  onClick: () => void;
}

const LOWER_RIGHT_MAPPING: Record<number, number> = {
  32: 24,
  31: 23,
  30: 22,
  29: 22,
  28: 21,
  27: 20,
  26: 19,
  25: 18,
};

const LOWER_LEFT_MAPPING: Record<number, number> = {
  17: 24,
  18: 23,
  19: 22,
  20: 22,
  21: 21,
  22: 20,
  23: 19,
  24: 18,
};

function getToothImage(number: number, isUpper: boolean): { imageNumber: number; mirrored: boolean } {
  if (isUpper) {
    if (number >= 1 && number <= 8) {
      return { imageNumber: number, mirrored: false };
    }

    return { imageNumber: 17 - number, mirrored: true };
  }

  if (number >= 25 && number <= 32) {
    return { imageNumber: LOWER_RIGHT_MAPPING[number], mirrored: false };
  }

  return { imageNumber: LOWER_LEFT_MAPPING[number], mirrored: true };
}

export function Tooth({ number, isUpper, record, selected, onClick }: ToothProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const changed = hasToothChanges(record);
  const { imageNumber, mirrored } = getToothImage(number, isUpper);
  const width = 54;
  const height = 96;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const image = new Image();
    image.onload = () => {
      context.clearRect(0, 0, width, height);

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = image.width;
      tempCanvas.height = image.height;
      const tempContext = tempCanvas.getContext("2d");
      if (!tempContext) return;

      tempContext.drawImage(image, 0, 0);
      const pixels = tempContext.getImageData(0, 0, tempCanvas.width, tempCanvas.height).data;

      let minX = tempCanvas.width;
      let minY = tempCanvas.height;
      let maxX = 0;
      let maxY = 0;

      for (let y = 0; y < tempCanvas.height; y += 1) {
        for (let x = 0; x < tempCanvas.width; x += 1) {
          const index = (y * tempCanvas.width + x) * 4;
          if (pixels[index + 3] > 0) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      if (maxX < minX || maxY < minY) {
        minX = 0;
        minY = 0;
        maxX = tempCanvas.width - 1;
        maxY = tempCanvas.height - 1;
      }

      const sourceWidth = maxX - minX + 1;
      const sourceHeight = maxY - minY + 1;

      context.save();
      if (mirrored) {
        context.translate(width, 0);
        context.scale(-1, 1);
      }
      context.drawImage(image, minX, minY, sourceWidth, sourceHeight, 0, 0, width, height);
      context.restore();

      if (changed) {
        const imageData = context.getImageData(0, 0, width, height);
        const data = imageData.data;

        for (let index = 0; index < data.length; index += 4) {
          if (data[index + 3] > 0) {
            data[index] = Math.min(255, data[index] * 0.52 + 244 * 0.48);
            data[index + 1] = Math.min(255, data[index + 1] * 0.45 + 177 * 0.55);
            data[index + 2] = Math.min(255, data[index + 2] * 0.52 + 198 * 0.48);
          }
        }

        context.putImageData(imageData, 0, 0);
      }

      setLoaded(true);
    };

    image.src = `/teeth/${imageNumber}.png`;
  }, [changed, imageNumber, mirrored]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-col items-center rounded-2xl px-1 py-2 transition-all",
        selected ? "bg-primary/8 ring-1 ring-primary/30" : "hover:bg-muted/70",
      )}
    >
      {isUpper ? <span className="mb-1 text-[11px] font-medium text-muted-foreground">{number}</span> : null}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={cn(
          "h-[74px] w-[38px] transition-transform duration-200 group-hover:scale-105 md:h-[86px] md:w-[44px]",
          !loaded && "opacity-0",
        )}
      />
      {!isUpper ? <span className="mt-1 text-[11px] font-medium text-muted-foreground">{number}</span> : null}
    </button>
  );
}
