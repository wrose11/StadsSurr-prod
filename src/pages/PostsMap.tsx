import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Button } from "@/components/ui/button";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Navigation from "@/components/Navigation";
import { apiFetch } from "@/api/config";


const greenIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});


interface PostFeature {
  type: string;
  geometry: {
    type: string;
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

interface GeoJSON {
  type: string;
  features: PostFeature[];
}

const PostsMap = () => {
  const [geoData, setGeoData] = useState<GeoJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch("/posts/geojson")
      .then((res) => res.json())
      .then((data) => {
        setGeoData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch posts geojson:", err);
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">Inlägg på kartan</h1>
          <p className="text-lg text-muted-foreground">
            Utforska medborgarnas inlägg och idéer på kartan (gröna markörer).
          </p>
        </div>

        <div className="h-[calc(100vh-250px)] rounded-lg overflow-hidden border border-border shadow-lg">
          <MapContainer
            center={[59.3293, 18.0686]}
            zoom={11}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {geoData?.features.map((feature) => {
              const [lng, lat] = feature.geometry.coordinates;
              return (
                <Marker key={feature.properties.id} position={[lat, lng]} icon={greenIcon}>
                  <Popup>
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
                      <Button
                        variant="accent" size="sm" className="w-full"
                        onClick={() => navigate(`/posts/${feature.properties.id}`)}>
                        Visa inlägg
                      </Button>
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

export default PostsMap;
