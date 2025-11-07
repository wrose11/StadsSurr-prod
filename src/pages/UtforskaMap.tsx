import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin, Calendar, User } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Navigation from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/api/config";

// Blue icon for projects
const blueIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Green icon for posts
const greenIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface ProjectFeature {
  type: "Feature";
  itemType: "project";
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

interface PostFeature {
  type: "Feature";
  itemType: "post";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    id: number;
    title: string;
    author_name: string;
    created_at: string;
    thumbnail?: string;
  };
}

type Feature = ProjectFeature | PostFeature;

const phaseColors: Record<string, string> = {
  "Planering": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Beslutad": "bg-purple-100 text-purple-800 border-purple-300",
  "Pågående": "bg-blue-100 text-blue-800 border-blue-300",
  "Genomfört": "bg-success/10 text-success border-success/20",
};

const UtforskaMap = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const typeFilter = searchParams.get("type") || "all";

  useEffect(() => {
    Promise.all([
      apiFetch("/projects/geojson").then((res) => res.json()),
      apiFetch("/posts/geojson").then((res) => res.json())
    ])
      .then(([projectsGeo, postsGeo]) => {
        const projectFeatures: ProjectFeature[] = projectsGeo.features.map((f: any) => ({
          ...f,
          itemType: "project" as const
        }));
        const postFeatures: PostFeature[] = postsGeo.features.map((f: any) => ({
          ...f,
          itemType: "post" as const
        }));
        setFeatures([...projectFeatures, ...postFeatures]);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch geojson:", err);
        setLoading(false);
      });
  }, []);

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

  // Filter features based on type
  let displayedFeatures = features;
  if (typeFilter === "projects") {
    displayedFeatures = features.filter(f => f.itemType === "project");
  } else if (typeFilter === "posts") {
    displayedFeatures = features.filter(f => f.itemType === "post");
  }

  // Stockholm center
  const center: [number, number] = [59.3293, 18.0686];

  const handleFilterChange = (value: string) => {
    if (value === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ type: value });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Utforska på kartan</h1>
          <p className="text-muted-foreground mb-4">
            Blå markörer = Projekt | Gröna markörer = Inlägg
          </p>
          
          <Select value={typeFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrera" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Visa allt</SelectItem>
              <SelectItem value="projects">Endast projekt</SelectItem>
              <SelectItem value="posts">Endast inlägg</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg overflow-hidden shadow-lg border border-border" style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}>
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
            
            {displayedFeatures.map((feature, index) => {
              const [lng, lat] = feature.geometry.coordinates;
              const isProject = feature.itemType === "project";
              const icon = isProject ? blueIcon : greenIcon;
              
              return (
                <Marker key={`${feature.itemType}-${feature.properties.id}-${index}`} position={[lat, lng]} icon={icon}>
                  <Popup>
                    {isProject ? (
                      <div className="min-w-[250px] p-2">
                        {feature.properties.thumbnail && (
                          <img
                            src={feature.properties.thumbnail}
                            alt={feature.properties.title}
                            className="w-full h-32 object-cover rounded-lg mb-3"
                          />
                        )}
                        <div className="mb-2">
                          <Badge variant="outline" className={`mb-2 ${phaseColors[feature.properties.phase] || 'bg-accent/10 text-accent border-accent/20'}`}>
                            {feature.properties.phase}
                          </Badge>
                          <h3 className="font-semibold text-lg mb-1">{feature.properties.title}</h3>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3" />
                            {feature.properties.location}
                          </div>
                          {feature.properties.start_date && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3" />
                              Start: {feature.properties.start_date}
                            </div>
                          )}
                        </div>
                        <Link to={`/project/${feature.properties.id}`}>
                          <Button variant="accent" size="sm" className="w-full">
                            Visa projekt
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="p-2 min-w-[200px]">
                        <h3 className="font-semibold text-base mb-1">
                          {feature.properties.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Av: {feature.properties.author_name}
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">
                          {new Date(feature.properties.created_at).toLocaleDateString("sv-SE")}
                        </p>
                        {feature.properties.thumbnail && (
                          <img
                            src={feature.properties.thumbnail}
                            alt={feature.properties.title}
                            className="w-full h-24 object-cover rounded mb-2"
                          />
                        )}
                        <Link to={`/posts/${feature.properties.id}`}>
                          <Button variant="accent" size="sm" className="w-full">
                            Visa inlägg
                          </Button>
                        </Link>
                      </div>
                    )}
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

export default UtforskaMap;
