import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/api/config";


const greenIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationMarkerProps {
  position: [number, number] | null;
  setPosition: (pos: [number, number]) => void;
}

function LocationMarker({ position, setPosition }: LocationMarkerProps) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : <Marker position={position} icon={greenIcon} />;
}

const CreatePost = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast({
        title: "Fyll i alla fält",
        description: "Titel och innehåll är obligatoriska.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const postData = {
        title: title.trim(),
        content: content.trim(),
        image_url: imageUrl.trim() || null,
        coordinates: markerPosition
          ? { latitude: markerPosition[0], longitude: markerPosition[1] }
          : null,
      };



      const res = await apiFetch("/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail);
      }

      const newPost = await res.json();

      toast({
        title: "Inlägg skapat!",
        description: "Ditt inlägg har publicerats.",
      });

      navigate(`/posts/${newPost.id}`);
    } catch (err: any) {
      toast({
        title: "Fel vid skapande av inlägg",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">Skapa nytt inlägg</h1>
          <p className="text-lg text-muted-foreground">
            Dela dina idéer, förslag eller debattartiklar med andra Stockholmare.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inläggsdetaljer</CardTitle>
              <CardDescription>
                Beskriv ditt förslag eller din idé. Var tydlig och konkret.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  placeholder="T.ex. Förslag om cykelväg vid Haga"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Innehåll *</Label>
                <Textarea
                  id="content"
                  placeholder="Beskriv ditt förslag eller din idé i detalj..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="min-h-[200px]"
                  maxLength={5000}
                />
                <p className="text-sm text-muted-foreground">
                  {content.length} / 5000 tecken
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Bild-URL (valfritt)</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://example.com/bild.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plats (valfritt)</CardTitle>
              <CardDescription>
                Klicka på kartan för att välja en plats för ditt inlägg.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] rounded-lg overflow-hidden border border-border">
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
                  <LocationMarker
                    position={markerPosition}
                    setPosition={setMarkerPosition}
                  />
                </MapContainer>
              </div>
              {markerPosition && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Vald plats: {markerPosition[0].toFixed(5)}, {markerPosition[1].toFixed(5)}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setMarkerPosition(null)}
                  >
                    Ta bort plats
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/posts")}
              disabled={submitting}
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Publicerar..." : "Publicera inlägg"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreatePost;
