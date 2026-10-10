"use client";

import Image from "next/image";
import { useContext, useState } from "react";
import { CarouselMediaContext } from "@/components/carousel/CarouselMediaContext.client";

import type { ProjectArt, ProjectImage } from "@/features/projects/project-types";
import type { Locale } from "@/i18n/config";

import { ProjectArtFallback } from "./ProjectArtFallback";

export function ProjectMedia({ image, title, slug, art, locale, conceptLabel }: {
  image?: ProjectImage; title: string; slug: string; art: ProjectArt; locale: Locale; conceptLabel: string;
}) {
  const media = useContext(CarouselMediaContext);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const [loadedSource, setLoadedSource] = useState<string | null>(null);
  const showImage = image && failedSource !== image.src && (!media || media.allowedSlugs.has(slug));
  const isPriority = media?.activeSlug === slug && media.visible;
  return (
    <div className="media-panel project-media">
      <div hidden={!!showImage && loadedSource === image?.src}><ProjectArtFallback title={title} art={art} /></div>
      {showImage && <Image src={image.src} alt={image.alt[locale]} width={image.width} height={image.height}
        loading={isPriority ? "eager" : "lazy"} fetchPriority={isPriority ? "high" : "auto"} sizes="(min-width: 1280px) 790px, (min-width: 768px) 73vw, 90vw"
        className={image.fit === "contain" ? "project-image project-image-contain" : "project-image"}
        onError={() => setFailedSource(image.src)} onLoad={() => setLoadedSource(image.src)} draggable={false} />}
      {(!image || image.kind === "concept" || !showImage) && <span className="project-art-caption">{conceptLabel}</span>}
    </div>
  );
}
