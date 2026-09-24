/** Ambient 3D depth layers for the hero section background. */
export default function HeroDepthLayers() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div className="hero-grid-floor" />
      <div className="hero-orb hero-orb-1" />
      <div className="hero-orb hero-orb-2" />
      <div className="hero-orb hero-orb-3" />
      <div className="hero-light-beam" />
    </div>
  );
}
