import {
  Bricolage_Grotesque,
  DM_Sans,
  Fraunces,
  Geist,
  Geist_Mono,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Instrument_Serif,
  Inter,
  JetBrains_Mono,
  Manrope,
  Nunito,
  Nunito_Sans,
  Quicksand,
  Sora,
  Source_Serif_4,
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

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], preload: false, weight: "400", style: ["normal", "italic"], variable: "--face-instrument-serif" });
const fraunces = Fraunces({ subsets: ["latin"], preload: false, variable: "--face-fraunces" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], preload: false, variable: "--face-source-serif-4" });
const inter = Inter({ subsets: ["latin"], preload: false, variable: "--face-inter" });
const ibmPlexSans = IBM_Plex_Sans({ subsets: ["latin"], preload: false, variable: "--face-ibm-plex-sans" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], preload: false, variable: "--face-space-grotesk" });
const dmSans = DM_Sans({ subsets: ["latin"], preload: false, variable: "--face-dm-sans" });
const manrope = Manrope({ subsets: ["latin"], preload: false, variable: "--face-manrope" });
const sora = Sora({ subsets: ["latin"], preload: false, variable: "--face-sora" });
const nunito = Nunito({ subsets: ["latin"], preload: false, variable: "--face-nunito" });
const nunitoSans = Nunito_Sans({ subsets: ["latin"], preload: false, variable: "--face-nunito-sans" });
const quicksand = Quicksand({ subsets: ["latin"], preload: false, variable: "--face-quicksand" });
const ibmPlexMono = IBM_Plex_Mono({ subsets: ["latin"], preload: false, weight: ["400", "500"], variable: "--face-ibm-plex-mono" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], preload: false, variable: "--face-jetbrains-mono" });

export const fontVariables = [
  bricolage,
  geist,
  geistMono,
  instrumentSerif,
  fraunces,
  sourceSerif,
  inter,
  ibmPlexSans,
  spaceGrotesk,
  dmSans,
  manrope,
  sora,
  nunito,
  nunitoSans,
  quicksand,
  ibmPlexMono,
  jetbrainsMono,
]
  .map((font) => font.variable)
  .join(" ");
