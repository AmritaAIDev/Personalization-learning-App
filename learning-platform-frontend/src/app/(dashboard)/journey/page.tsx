import JourneyMap from "@/components/journey/JourneyMap";
import { JourneyProvider } from "@/context/JourneyContext";

export default function JourneyPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <JourneyProvider>
        <JourneyMap />
      </JourneyProvider>
    </div>
  );
}
