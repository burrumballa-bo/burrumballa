import Link from "next/link";

import { Kicker } from "@/components/site/Kicker";
import { Media } from "@/components/site/Media";
import { SiteShell } from "@/components/site/SiteShell";
import { textColorFor } from "@/lib/color";
import {
  getChiSiamoContent,
  getCrewGroups,
  getFooterContent,
} from "@/lib/cms/queries";
import { rowNeedsCentering } from "@/lib/gridWrap";
import { cn } from "@/lib/utils";

export const revalidate = 60;

export const metadata = {
  title: "Chi siamo",
  description:
    "Burrumballa: scuola di danza urbana e collettivo hip hop nato a Bologna, al Circolo La Fattoria.",
};

const VALORI_PALETTE = ["#ec1e89", "#7e3fae", "#8be03c", "#f6a323"];

export default async function ChiSiamoPage() {
  const [content, footer, crewGroups] = await Promise.all([
    getChiSiamoContent(),
    getFooterContent(),
    getCrewGroups(),
  ]);

  return (
    <SiteShell active="chi-siamo" footer={footer}>
      {/* HERO MANIFESTO */}
      <div className="mx-auto max-w-[1200px] px-6 pt-13 pb-6">
        <Kicker color="#ec1e89" className="-rotate-1">
          {content.hero.kicker}
        </Kicker>
        <h1 className="font-display mt-3 max-w-[880px] text-[38px] leading-[0.95] tracking-[-1.5px] sm:text-[48px] md:text-[64px] md:tracking-[-2.5px]">
          {content.hero.title}
        </h1>
        {/* Stesso pannello "glass" della fascia Chi siamo in home e delle
            card disciplina in /corsi: viola al 25% + backdrop-blur sopra al
            muro di WallBackground. Il testo non forza un colore così resta
            leggibile sia in tema chiaro che scuro (bb-ink si inverte). */}
        <p className="bg-bb-purple/25 border-bb-ink mt-5.5 max-w-[620px] border-[3px] p-5 text-[18px] leading-relaxed backdrop-blur-md md:p-6">
          {content.hero.subtitle}
        </p>
      </div>

      {/* STORY */}
      <div className="mx-auto max-w-[1200px] px-6 pt-5">
        <div className="grid grid-cols-1 items-center gap-9 md:grid-cols-[1.1fr_0.9fr]">
          <div className="relative">
            <div
              className="bg-bb-purple absolute inset-[14px_-10px_-10px_14px]"
              aria-hidden="true"
            />
            <Media
              src={content.story.imageUrl}
              alt=""
              fallbackColor="#7e3fae"
              className="border-bb-ink relative block h-[320px] w-full border-[3px] object-cover md:h-[380px]"
            />
          </div>
          <div className="bg-bb-purple/25 border-bb-ink border-[3px] p-6 backdrop-blur-md md:p-8">
            <div className="font-display-alt text-[36px] leading-[0.95] md:text-[44px]">
              {content.story.title}
            </div>
            <p className="mt-4 text-[15px] leading-relaxed">
              {content.story.paragraph1}
            </p>
            <p className="mt-4 text-[15px] leading-relaxed">
              {content.story.paragraph2}
            </p>
          </div>
        </div>
      </div>

      {/* VALORI */}
      <div className="mx-auto max-w-[1200px] px-6 pt-14">
        <Kicker>{content.valori.kicker}</Kicker>
        <h2 className="font-display mt-1 mb-6 text-[30px] tracking-[-1.5px] md:text-[40px]">
          {content.valori.title}
        </h2>
        {(() => {
          const total = content.valori.items.length;
          const baseFix = rowNeedsCentering(total, 2);
          const mdFix = rowNeedsCentering(total, 4);
          return (
            <div
              className={cn(
                "gap-3.5",
                baseFix ? "flex flex-wrap justify-center" : "grid grid-cols-2",
                mdFix
                  ? "md:flex md:flex-wrap md:justify-center"
                  : "md:grid md:grid-cols-4",
              )}
            >
              {content.valori.items.map((item, index) => {
                const color = VALORI_PALETTE[index % VALORI_PALETTE.length];
                return (
                  <div
                    key={item.title}
                    className={cn(
                      "border-bb-ink min-h-[180px] border-[3px] p-5.5",
                      baseFix && "shrink-0 basis-[calc(50%-0.4375rem)]",
                      mdFix && "md:shrink-0 md:basis-[calc(25%-0.65625rem)]",
                    )}
                    style={{ background: color, color: textColorFor(color) }}
                  >
                    <div className="font-display text-[34px]">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="font-display-alt mt-2 mb-1.5 text-[22px]">
                      {item.title}
                    </div>
                    <p className="text-[13px] leading-relaxed opacity-95">
                      {item.body}
                    </p>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* CREW */}
      {crewGroups.length > 0 && (
        <div className="mx-auto max-w-[1200px] px-6 pt-14">
          <Kicker color="#ec1e89">{content.crew.kicker}</Kicker>
          <h2 className="font-display mt-1 mb-1.5 text-[30px] tracking-[-1.5px] md:text-[40px]">
            {content.crew.title}
          </h2>
          <p className="mb-6 max-w-[560px] text-sm">{content.crew.subtitle}</p>
          {(() => {
            const mdFix = rowNeedsCentering(crewGroups.length, 2);
            return (
              <div
                className={cn(
                  "grid grid-cols-1 gap-5",
                  mdFix
                    ? "md:flex md:flex-wrap md:justify-center"
                    : "md:grid md:grid-cols-2",
                )}
              >
                {crewGroups.map((group) => (
                  <div
                    key={group.id}
                    className={cn(
                      "border-bb-ink bg-bb-surface overflow-hidden border-[3px]",
                      mdFix && "md:shrink-0 md:basis-[calc(50%-0.625rem)]",
                    )}
                  >
                    <Media
                      src={group.image_url}
                      alt={group.title}
                      fallbackColor="#7e3fae"
                      className="border-bb-ink block h-[300px] w-full border-b-[3px] object-cover"
                    />
                    <div className="p-4.5">
                      <div className="font-display text-[17px]">
                        {group.title}
                      </div>
                      {group.body && (
                        <div className="mt-1 text-[13px]">{group.body}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* KIDS */}
      <div className="mx-auto max-w-[1200px] px-6 pt-14">
        <div className="bg-bb-ink text-bb-cream grid grid-cols-1 overflow-hidden md:grid-cols-2">
          <div className="flex flex-col justify-center p-8 md:p-10.5">
            <Kicker color="#8be03c">{content.kids.kicker}</Kicker>
            <h2 className="font-display mt-2 mb-3.5 text-[30px] leading-[1] tracking-[-1px] md:text-[38px]">
              {content.kids.title}
            </h2>
            <p className="text-bb-cream/75 max-w-[420px] text-[15px] leading-relaxed">
              {content.kids.body}
            </p>
          </div>
          <div className="relative min-h-[260px] md:min-h-[340px]">
            <Media
              src={content.kids.imageUrl}
              alt=""
              fallbackColor="#f6a323"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* CIRCOLO / SEDE */}
      <div className="mx-auto max-w-[1200px] px-6 pt-14">
        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
          <div className="border-bb-ink overflow-hidden border-[3px]">
            <Media
              src={content.place.imageUrl}
              alt={content.place.locationName}
              fallbackColor="#1a1a1a"
              className="block h-full min-h-[260px] w-full object-cover"
            />
          </div>
          <div className="bg-bb-purple border-bb-ink flex flex-col justify-center border-[3px] p-8 text-white">
            <div className="font-display-alt text-[30px] leading-[0.95] md:text-[34px]">
              {content.place.title}
            </div>
            <p className="mt-3.5 mb-4.5 text-[15px] leading-relaxed text-neutral-100">
              {content.place.body}
            </p>
            <div className="text-sm leading-loose font-semibold">
              {content.place.locationName}
              <br />
              {content.place.addressLine1} · {content.place.addressLine2}
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mx-auto mt-11 max-w-[1200px] px-6">
        <div className="bg-bb-pink border-bb-ink border-[3px] p-9 text-center text-white">
          <h2 className="font-display text-[30px] tracking-[-2px] md:text-[42px]">
            {content.ctaBand.title}
          </h2>
          <p className="mt-2 mb-5 text-[15px] opacity-95">
            {content.ctaBand.subtitle}
          </p>
          <Link
            href="/corsi"
            className="bg-bb-ink text-bb-cream inline-block px-6.5 py-3.5 text-[15px] font-bold"
          >
            Iscriviti →
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
