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
  alignBottom?: boolean;
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

export function Tooth({ number, isUpper, record, selected, onClick, alignBottom = false }: ToothProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const changed = hasToothChanges(record);
  const { imageNumber, mirrored } = getToothImage(number, isUpper);

  const canvasWidth = 48;
  const canvasHeight = 84;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvasWidth, canvasHeight);

    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      context.clearRect(0, 0, canvasWidth, canvasHeight);

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
        context.translate(canvasWidth, 0);
        context.scale(-1, 1);
      }
      context.drawImage(image, minX, minY, sourceWidth, sourceHeight, 0, 0, canvasWidth, canvasHeight);
      context.restore();

      if (changed) {
        const imageData = context.getImageData(0, 0, canvasWidth, canvasHeight);
        const data = imageData.data;

        for (let index = 0; index < data.length; index += 4) {
          if (data[index + 3] > 0) {
            data[index] = Math.min(255, data[index] * 0.78 + 239 * 0.22);
            data[index + 1] = Math.min(255, data[index + 1] * 0.78 + 68 * 0.22);
            data[index + 2] = Math.min(255, data[index + 2] * 0.78 + 68 * 0.22);
          }
        }

        context.putImageData(imageData, 0, 0);
      }

      setLoaded(true);
    };

    image.src = `/teeth/${imageNumber}.png`;
  }, [canvasHeight, canvasWidth, changed, imageNumber, mirrored]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((event.clientX - rect.left) * scaleX);
    const y = Math.floor((event.clientY - rect.top) * scaleY);
    const pixel = context.getImageData(x, y, 1, 1).data;

    if (pixel[3] > 10) {
      onClick();
    }
  };

  return (
    <div
      className={cn(
        "relative flex flex-none flex-col items-center justify-start rounded-lg transition-colors",
        "w-[18px] md:w-[24px]",
        alignBottom ? "justify-end" : "justify-start",
        selected && "bg-primary/10",
      )}
    >
      {isUpper ? (
        <span className="w-full text-center text-[8px] font-medium leading-none text-muted-foreground md:text-[10px]">
          {number}
        </span>
      ) : null}

      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        onClick={handleCanvasClick}
        className={cn(
          "block cursor-pointer flex-none transition-transform duration-200 hover:scale-105",
          "h-[56px] w-[18px] md:h-[72px] md:w-[24px]",
          !loaded && "opacity-0",
        )}
      />

      {!isUpper ? (
        <span className="w-full text-center text-[8px] font-medium leading-none text-muted-foreground md:text-[10px]">
          {number}
        </span>
      ) : null}
    </div>
  );
}
