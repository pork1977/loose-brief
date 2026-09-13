import {
  Bricolage_Grotesque,
  Geist,
  Geist_Mono,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Instrument_Serif,
  Inter,
  JetBrains_Mono,
  Nunito,
  Nunito_Sans,
  Space_Grotesk,
} from "next/font/google";

/*
 * Font loaders. Only the root layout imports this file.
 *
 * App fonts dress Loose Brief itself and are preloaded.
 *
 * Brand fonts are the curated list a generated identity can choose from (the
 * registry is in lib/brand-fonts.ts). They are not preloaded: the browser only
 * downloads a face once something on the page is actually set in it.
 */

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--face-bricolage-grotesque",
  axes: ["opsz"],
});
const geist = Geist({ subsets: ["latin"], variable: "--face-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--face-geist-mono" });

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--face-instrument-serif",
  preload: false,
});
const inter = Inter({ subsets: ["latin"], variable: "--face-inter", preload: false });
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--face-ibm-plex-mono",
  preload: false,
});
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--face-ibm-plex-sans",
  preload: false,
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--face-space-grotesk",
  preload: false,
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--face-jetbrains-mono",
  preload: false,
});
const nunito = Nunito({ subsets: ["latin"], variable: "--face-nunito", preload: false });
const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--face-nunito-sans",
  preload: false,
});

export const fontVariables = [
  bricolage,
  geist,
  geistMono,
  instrumentSerif,
  inter,
  ibmPlexMono,
  ibmPlexSans,
  spaceGrotesk,
  jetbrainsMono,
  nunito,
  nunitoSans,
]
  .map((font) => font.variable)
  .join(" ");
