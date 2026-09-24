import Image, { type ImageProps } from "next/image";

/** next/image wrapper: SVG placeholders are served as-is, raster images get AVIF/WebP optimisation. */
export function SmartImage(props: ImageProps & { src: string }) {
  const isSvg = props.src.endsWith(".svg");
  return <Image {...props} unoptimized={isSvg || props.unoptimized} alt={props.alt} />;
}
