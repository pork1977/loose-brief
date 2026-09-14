import { isDemoDirection } from "@/data/demo-ids";
import type { Direction, VisualStyle } from "@/lib/direction";
import { CoastlineVisual } from "./CoastlineVisual";
import { MotifVisual } from "./MotifVisual";

/**
 * The hero illustration for any direction: its motif shapes when it has them,
 * otherwise the Ebbfield coastline (with its labels only on Ebbfield itself).
 * `style` overrides the direction's own, for previews of the other styles.
 */
export function BrandIllustration({ direction, style, className }: { direction: Direction; style?: VisualStyle; className?: string }) {
  const visual = style ?? direction.visual;
  if (direction.illustration) return <MotifVisual style={visual} illustration={direction.illustration} className={className} />;
  return <CoastlineVisual style={visual} className={className} abstract={!isDemoDirection(direction.id)} />;
}
