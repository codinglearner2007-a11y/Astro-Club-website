import CosmicCanvas from '@/components/cosmic-scroll/CosmicCanvas';

export default function Home() {
  return (
    <>
      {/* The canvas and UI are fixed to the viewport */}
      <CosmicCanvas />
      {/* This div creates the scrollable height for the animation timeline */}
      <div className="h-[600vh]" />
    </>
  );
}
