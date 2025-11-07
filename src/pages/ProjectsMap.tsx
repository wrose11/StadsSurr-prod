import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin, Calendar } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Navigation from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/api/config";


// Fix for default marker icon
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface ProjectFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    id: number;
    title: string;
    phase: string;
    location: string;
    start_date?: string;
    thumbnail?: string;
  };
}

interface GeoJSON {
  type: "FeatureCollection";
  features: ProjectFeature[];
}

const phaseColors: Record<string, string> = {
  "Planering": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Beslutad": "bg-purple-100 text-purple-800 border-purple-300",
  "Pågående": "bg-blue-100 text-blue-800 border-blue-300",
  "Genomfört": "bg-success/10 text-success border-success/20",
};

const ProjectsMap = () => {
  const [searchParams] = useSearchParams();
  const [geojson, setGeojson] = useState<GeoJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const phaseFilter = searchParams.get("phase");


  useEffect(() => {
    // Build query string safely
    const qs = phaseFilter ? `?phase=${encodeURIComponent(phaseFilter)}` : "";

    apiFetch(`/projects/geojson${qs}`)
      .then((res) => res.json())
      .then((data) => {
        setGeojson(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch geojson:", err);
        setLoading(false);
      });
  }, [phaseFilter]);


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Laddar karta...</p>
        </main>
      </div>
    );
  }

  // Stockholm center
  const center: [number, number] = [59.3293, 18.0686];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Projektkarta</h1>
          <p className="text-muted-foreground">
            {phaseFilter 
              ? `Projekt i fas: ${phaseFilter}` 
              : "Alla projekt med geografisk position visas på kartan"}
          </p>
          {phaseFilter && (
            <Link to="/projects/map">
              <Button variant="ghost" size="sm" className="mt-2">
                Visa alla projekt
              </Button>
            </Link>
          )}
        </div>

        <div className="rounded-lg overflow-hidden shadow-lg border border-border" style={{ height: "calc(100vh - 240px)", minHeight: "500px" }}>
          <MapContainer
            center={center}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {geojson?.features.map((feature) => {
              const [lng, lat] = feature.geometry.coordinates;
              const props = feature.properties;
              
              return (
                <Marker key={props.id} position={[lat, lng]}>
                  <Popup>
                    <div className="min-w-[250px] p-2">
                      {props.thumbnail && (
                        <img
                          src={props.thumbnail}
                          alt={props.title}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      )}
                      <div className="mb-2">
                        <Badge variant="outline" className={`mb-2 ${phaseColors[props.phase] || 'bg-accent/10 text-accent border-accent/20'}`}>
                          {props.phase}
                        </Badge>
                        <h3 className="font-semibold text-lg mb-1">{props.title}</h3>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3" />
                          {props.location}
                        </div>
                        {props.start_date && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            Start: {props.start_date}
                          </div>
                        )}
                      </div>
                      <Link to={`/project/${props.id}`}>
                        <Button variant="accent" size="sm" className="w-full">
                          Visa projekt
                        </Button>
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </main>
    </div>
  );
};

export default ProjectsMap;
