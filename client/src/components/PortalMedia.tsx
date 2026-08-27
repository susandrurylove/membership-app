import type { PortalImage } from "@/lib/portalImages";
import { BunnyImage } from "@/components/BunnyImage";

export function PortalImage({
  image,
  className = "",
  eager = false,
}: {
  image: PortalImage;
  className?: string;
  eager?: boolean;
}) {
  return (
    <BunnyImage
      src={image.src}
      alt={image.alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      decoding="async"
      className={`h-full w-full object-cover ${className}`}
      style={{ objectPosition: image.focalPoint }}
    />
  );
}

export function PortalHeroImage({
  image,
  eager = true,
  className = "",
}: {
  image: PortalImage;
  eager?: boolean;
  className?: string;
}) {
  return (
    <div className={`portal-hero-media ${className}`} aria-hidden="true">
      <PortalImage image={{ ...image, alt: "" }} eager={eager} />
      <div className="portal-hero-media__veil" />
    </div>
  );
}

export function PortalCardMedia({
  image,
  className = "",
}: {
  image: PortalImage;
  className?: string;
}) {
  return (
    <div className={`portal-card-media ${className}`}>
      <PortalImage image={image} />
      <div className="portal-card-media__veil" aria-hidden="true" />
    </div>
  );
}
