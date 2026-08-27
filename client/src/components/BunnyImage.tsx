import { useEffect, useMemo, useState, type ImgHTMLAttributes } from "react";

const MEMBERSHIP_BUNNY_ORIGIN = "https://membership-susan.b-cdn.net/";
const SAFE_ASSET_PATH = /^(teachings|portal)\/v2\/[a-z0-9-]+\.webp$/;

function getFallbackSource(src: string): string | null {
  if (!src.startsWith(MEMBERSHIP_BUNNY_ORIGIN)) return null;
  const assetPath = src.slice(MEMBERSHIP_BUNNY_ORIGIN.length);
  return SAFE_ASSET_PATH.test(assetPath) ? `/api/public/images/${assetPath}` : null;
}

export type BunnyImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
};

export function BunnyImage({ src, onError, onLoad, ...props }: BunnyImageProps) {
  const fallbackSource = useMemo(() => getFallbackSource(src), [src]);
  const [resolvedSource, setResolvedSource] = useState(src);

  useEffect(() => {
    setResolvedSource(src);
  }, [src]);

  return (
    <img
      {...props}
      src={resolvedSource}
      data-bunny-source={src}
      onLoad={event => onLoad?.(event)}
      onError={event => {
        if (fallbackSource && resolvedSource === src) {
          setResolvedSource(fallbackSource);
          return;
        }
        onError?.(event);
      }}
    />
  );
}
