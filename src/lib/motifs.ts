/*
 * The shapes a brand illustration is built from.
 *
 * Each motif is a handful of SVG path outlines on a 48 by 48 grid, all in the
 * same simple line style, so any mix of them looks like one set. They carry
 * no colour: the illustration styles colour them from the brand tokens.
 *
 * Claude picks from this list by id, so nothing it writes is drawn directly.
 */

const c = (cx: number, cy: number, r: number) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;

/** A grain of wheat either side of the stalk at height y. */
const grains = (y: number) => [`M24 ${y}C18 ${y - 1} 15 ${y - 5} 16 ${y - 10}C21 ${y - 9} 24 ${y - 5} 24 ${y}Z`, `M24 ${y}C30 ${y - 1} 33 ${y - 5} 32 ${y - 10}C27 ${y - 9} 24 ${y - 5} 24 ${y}Z`];

const star = (() => {
  const points = Array.from({ length: 10 }, (_, i) => {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? 19 : 8;
    return `${Math.round((24 + r * Math.cos(angle)) * 10) / 10} ${Math.round((25 + r * Math.sin(angle)) * 10) / 10}`;
  });
  return `M${points.join("L")}Z`;
})();

const rays = Array.from({ length: 8 }, (_, i) => {
  const a = (Math.PI / 4) * i;
  const p = (r: number) => `${Math.round((24 + r * Math.cos(a)) * 10) / 10} ${Math.round((24 + r * Math.sin(a)) * 10) / 10}`;
  return `M${p(13)}L${p(20)}`;
});

export const MOTIFS = [
  // Food and drink
  { id: "wheat", label: "Wheat", paths: ["M24 44V12", ...grains(20), ...grains(28), ...grains(36), "M24 12C21 8 22 5 24 2C26 5 27 8 24 12Z"] },
  { id: "loaf", label: "Loaf", paths: ["M7 36H41V31C41 19 33 12 24 12C15 12 7 19 7 31Z", "M15 22L19 27", "M22 19L26 24", "M29 19L33 24"] },
  { id: "cup", label: "Cup", paths: ["M9 19H34V30C34 36 29 40 22 40H21C14 40 9 36 9 30Z", "M34 22H37C40 22 42 24 42 27C42 30 40 32 37 32H34", "M17 14C15 11 19 9 17 5", "M25 14C23 11 27 9 25 5", "M6 44H38"] },
  { id: "bowl", label: "Bowl", paths: ["M6 23H42C42 33 34 40 24 40C14 40 6 33 6 23Z", "M18 17C16 14 20 12 18 8", "M26 17C24 14 28 12 26 8", "M16 44H32"] },
  { id: "glass", label: "Glass", paths: ["M15 6H33C33 18 30 25 24 25C18 25 15 18 15 6Z", "M24 25V40", "M16 41H32", "M16 13H32"] },
  // Getting about
  { id: "car", label: "Car", paths: ["M5 32V26C5 24 6 23 8 23L13 15H31L37 23H40C42 23 43 24 43 26V32Z", "M15 23L18 18H29L32 23Z", c(14, 32, 4.5), c(34, 32, 4.5)] },
  { id: "bike", label: "Bike", paths: [c(12, 31, 8), c(36, 31, 8), "M12 31L19 18H31L36 31", "M19 18L25 31H12", "M31 18L29 12H34", "M17 13H22"] },
  { id: "pin", label: "Map pin", paths: ["M24 44C24 44 10 30 10 19C10 11 16 5 24 5C32 5 38 11 38 19C38 30 24 44 24 44Z", c(24, 19, 5)] },
  { id: "route", label: "Route", paths: ["M9 38C18 38 17 25 24 25C31 25 30 12 39 12", c(8, 38, 3.5), c(40, 11, 3.5)] },
  { id: "parcel", label: "Parcel", paths: ["M8 16L24 8L40 16V34L24 42L8 34Z", "M8 16L24 24L40 16", "M24 24V42", "M16 12L32 20"] },
  // Home and trade
  { id: "house", label: "House", paths: ["M12 20V40H36V20", "M7 23L24 8L41 23", rr(20, 28, 8, 12, 1)] },
  { id: "key", label: "Key", paths: [c(14, 24, 8), c(14, 24, 3), "M22 24H42", "M36 24V30", "M42 24V29"] },
  { id: "spanner", label: "Spanner", paths: ["M31 7C26 6 21 10 22 16L8 30C6 32 6 36 8 38C10 40 14 40 16 38L30 24C36 25 40 20 39 15L33 20L28 18L26 13Z"] },
  { id: "hammer", label: "Hammer", paths: ["M9 40L28 21", "M24.7 6.5L37.5 19.3L33.3 23.5L20.5 10.7Z"] },
  { id: "brush", label: "Paintbrush", paths: ["M30 6L42 18L27 31L17 21Z", "M17 21C11 21 8 26 8 31C8 37 6 40 4 42C13 42 20 40 22 34C23 31 23 28 27 31"] },
  { id: "scissors", label: "Scissors", paths: [c(13, 37, 5), c(35, 37, 5), "M16 33L34 7", "M32 33L14 7"] },
  // Health and people
  { id: "heart", label: "Heart", paths: ["M24 41C24 41 7 31 7 18C7 11 12 7 17 7C20 7 23 9 24 12C25 9 28 7 31 7C36 7 41 11 41 18C41 31 24 41 24 41Z"] },
  { id: "plus", label: "Health cross", paths: ["M19 8H29V19H40V29H29V40H19V29H8V19H19Z"] },
  { id: "person", label: "Person", paths: [c(24, 15, 7), "M9 42C9 32 16 26 24 26C32 26 39 32 39 42"] },
  { id: "dumbbell", label: "Dumbbell", paths: ["M14 24H34", rr(8, 15, 6, 18, 2), rr(34, 15, 6, 18, 2), "M5 20V28", "M43 20V28"] },
  { id: "paw", label: "Paw", paths: ["M15 35C15 29 19 25 24 25C29 25 33 29 33 35C33 39 29 41 24 39C19 41 15 39 15 35Z", c(13, 22, 3.5), c(20, 15, 3.5), c(28, 15, 3.5), c(35, 22, 3.5)] },
  { id: "mortarboard", label: "Graduation cap", paths: ["M4 18L24 10L44 18L24 26Z", "M12 22V32C12 37 36 37 36 32V22", "M42 19V29"] },
  // Nature
  { id: "leaf", label: "Leaf", paths: ["M9 39C9 21 21 9 40 8C39 27 27 39 9 39Z", "M9 39L28 20"] },
  { id: "tree", label: "Tree", paths: [c(24, 18, 12), "M24 30V44", "M24 36L18 30", "M17 44H31"] },
  { id: "flower", label: "Flower", paths: [c(24, 11, 5), c(31, 18, 5), c(24, 25, 5), c(17, 18, 5), c(24, 18, 3), "M24 30V44", "M24 38C28 34 32 34 35 36"] },
  { id: "sun", label: "Sun", paths: [c(24, 24, 8), ...rays] },
  { id: "wave", label: "Wave", paths: ["M4 20C10 14 16 14 22 20C28 26 34 26 40 20C42 18 44 17 45 17", "M4 31C10 25 16 25 22 31C28 37 34 37 40 31C42 29 44 28 45 28"] },
  { id: "mountain", label: "Mountain", paths: ["M4 40L18 15L26 28L32 20L44 40Z", "M13 24L18 15L23 24"] },
  { id: "drop", label: "Water drop", paths: ["M24 6C24 6 12 20 12 29C12 36 17 42 24 42C31 42 36 36 36 29C36 20 24 6 24 6Z", "M18 30C18 34 20 36 23 37"] },
  // Shops and money
  { id: "bag", label: "Shopping bag", paths: [rr(9, 17, 30, 25, 3), "M17 21V14C17 10 20 7 24 7C28 7 31 10 31 14V21"] },
  { id: "tag", label: "Price tag", paths: ["M8 8H24L42 26L26 42L8 24Z", c(16, 16, 3)] },
  { id: "card", label: "Payment card", paths: [rr(5, 12, 38, 26, 4), "M5 20H43", "M11 31H20"] },
  { id: "chart", label: "Chart", paths: ["M7 41H43", rr(11, 27, 6, 14, 1), rr(21, 18, 6, 23, 1), rr(31, 9, 6, 32, 1)] },
  { id: "star", label: "Star", paths: [star] },
  // Work and tech
  { id: "phone", label: "Phone", paths: [rr(14, 5, 20, 38, 4), "M21 37H27"] },
  { id: "laptop", label: "Laptop", paths: [rr(9, 10, 30, 21, 2), "M4 38H44L41 31H7Z"] },
  { id: "speech", label: "Speech bubble", paths: ["M8 9H40C42 9 43 10 43 12V29C43 31 42 32 40 32H20L11 40V32H8C6 32 5 31 5 29V12C5 10 6 9 8 9Z", c(16, 21, 1.5), c(24, 21, 1.5), c(32, 21, 1.5)] },
  { id: "calendar", label: "Calendar", paths: [rr(7, 10, 34, 31, 3), "M7 19H41", "M16 6V13", "M32 6V13", "M14 26H18", "M22 26H26", "M30 26H34", "M14 33H18", "M22 33H26"] },
  { id: "clock", label: "Clock", paths: [c(24, 24, 17), "M24 13V24L31 29"] },
  { id: "book", label: "Book", paths: ["M24 12C19 8 12 8 6 10V38C12 36 19 36 24 40C29 36 36 36 42 38V10C36 8 29 8 24 12Z", "M24 12V40"] },
  { id: "pencil", label: "Pencil", paths: ["M10 38L12 30L32 10L38 16L18 36Z", "M28 14L34 20", "M12 30L18 36"] },
  { id: "camera", label: "Camera", paths: [rr(5, 14, 38, 26, 4), "M16 14L19 8H29L32 14", c(24, 27, 8)] },
  { id: "music", label: "Music note", paths: ["M18 34V10L38 6V30", c(13, 34, 5), c(33, 30, 5)] },
  { id: "bulb", label: "Light bulb", paths: ["M18 30C12 26 10 20 12 14C14 8 19 5 24 5C29 5 34 8 36 14C38 20 36 26 30 30V34H18Z", "M19 38H29", "M21 42H27"] },
  { id: "shield", label: "Shield", paths: ["M24 5L40 11V22C40 32 33 39 24 43C15 39 8 32 8 22V11Z", "M17 24L22 29L31 19"] },
  { id: "globe", label: "Globe", paths: [c(24, 24, 18), "M6 24H42", "M24 6C16 12 16 36 24 42C32 36 32 12 24 6"] },
  { id: "spark", label: "Spark", paths: ["M24 4C25 16 32 23 44 24C32 25 25 32 24 44C23 32 16 25 4 24C16 23 23 16 24 4Z"] },
] as const;

export type MotifId = (typeof MOTIFS)[number]["id"];
export const MOTIF_IDS = MOTIFS.map((m) => m.id) as [MotifId, ...MotifId[]];

export function motif(id: MotifId) {
  return MOTIFS.find((m) => m.id === id) ?? MOTIFS[MOTIFS.length - 1];
}

/** How the shapes are arranged in the frame. */
export const LAYOUTS = ["hero", "row", "journey", "scatter"] as const;
export type Layout = (typeof LAYOUTS)[number];

export const LAYOUT_LABELS: Record<Layout, { label: string; description: string }> = {
  hero: { label: "Hero", description: "One large shape with two small ones" },
  row: { label: "Row", description: "Side by side, evenly spaced" },
  journey: { label: "Journey", description: "Along a route, from start to finish" },
  scatter: { label: "Pattern", description: "A repeating, scattered pattern" },
};
