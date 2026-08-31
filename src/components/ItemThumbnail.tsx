"use client";

import React, { useState } from "react";
import { ImageIcon } from "lucide-react";

interface ItemThumbnailProps {
  src?: string | null;
  alt?: string;
  className?: string;
  iconClassName?: string;
}

export function ItemThumbnail({
  src,
  alt = "Item Thumbnail",
  className = "w-12 h-12 sm:w-14 sm:h-14",
  iconClassName = "w-5 h-5 text-zinc-600",
}: ItemThumbnailProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-center justify-center select-none shadow-sm ${className}`}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full p-1 bg-zinc-950/80">
          <ImageIcon className={iconClassName} />
        </div>
      )}
    </div>
  );
}

