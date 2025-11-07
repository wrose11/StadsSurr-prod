import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Users, 
  Building2, 
  Globe2, 
  Lightbulb, 
  MessageSquare, 
  MapPin, 
  TrendingUp,
  Sparkles,
  Target,
  Rocket,
  LineChart,
  CheckCircle2
} from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="civic-gradient-subtle absolute inset-0" />
        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 text-base px-4 py-2" variant="secondary">
              <Sparkles className="h-4 w-4 mr-2" />
              KTH DD2465 Projekt 2025
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">
              Om StadsSurr
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Vi förflyttar medborgardialogen från reaktiv till proaktiv – från tillfälliga 
              samråd till ett levande, kontinuerligt samtal om stadens framtid.
            </p>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Problemet vi löser</h2>
            <p className="text-xl text-muted-foreground">
              Ett glapp mellan ambition och verklighet
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="border-2 hover:border-accent/50 transition-all hover:shadow-lg">
              <CardContent className="p-8">
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Splittrad information</h3>
                <p className="text-muted-foreground">
                  Projektinformation är gömd bakom komplexa hemsidor, tunga PDF-dokument 
                  och föråldrade blanketter som kräver tålamod snarare än engagemang.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent/50 transition-all hover:shadow-lg">
              <CardContent className="p-8">
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Förlorat engagemang</h3>
                <p className="text-muted-foreground">
                  Diskussionen sker i Facebookgrupper och på Instagram – inte där besluten 
                  faktiskt fattas. Värdefulla insikter når aldrig fram.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent/50 transition-all hover:shadow-lg">
              <CardContent className="p-8">
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <Building2 className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Höga trösklar</h3>
                <p className="text-muted-foreground">
                  Kostnaden för att delta – i tid och energi – överstiger den upplevda nyttan. 
                  Människor reagerar när beslut redan är fattade.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-muted/50 border-2 border-accent/20">
            <CardContent className="p-8 md:p-12">
              <div className="flex items-start gap-4">
                <Lightbulb className="h-8 w-8 text-accent shrink-0 mt-1" />
                <div>
                  <h3 className="text-2xl font-bold mb-3">Idéens födelse</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Allt började när en gruppmedlem själv försökte lämna synpunkter på Bromma flygplats utveckling. 
                    Trots att möjligheten till deltagande fanns, var den gömd bakom svårnavigerade sidor, 
                    tungt språk och PDF-filer. Vi insåg att intresset för att delta finns – men vägen dit 
                    är alldeles för krånglig. Stockholm utvecklas <em>runt</em> oss, snarare än <em>med</em> oss.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Our Journey */}
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Vår resa</h2>
            <p className="text-xl text-muted-foreground">
              Från problem till lösning genom forskning och iteration
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                icon: MessageSquare,
                title: "100 fältintervjuer",
                description: "Vi genomförde intervjuer i City för att förstå medborgarnas upplevelser. Genom att aktivt söka upp människor undvek vi självselektion och fick en bred bild av hur stadsutveckling uppfattas.",
                color: "text-blue-500"
              },
              {
                icon: Building2,
                title: "Expertintervjuer",
                description: "Genom samtal med anställd vid Stockholms stadsbyggnadskontor förstod vi kommunens perspektiv på medborgardialog. Vi lärde oss att analoga metoder begränsar räckvidden och att nya digitala kanaler efterfrågas.",
                color: "text-purple-500"
              },
              {
                icon: LineChart,
                title: "Research & analys",
                description: "Vi studerade Plan- och bygglagen, Boverkets riktlinjer, och regeringens policy för Gestaltad livsmiljö. Vi tog del av kommunala rapporter samt aktuell forskning kring området.",
                color: "text-green-500"
              },
              {
                icon: Sparkles,
                title: "Designworkshops",
                description: "Vi kombinerade insikter från intervjuer, artiklar om engagemang, och inspiration från digitala plattformar. Genom iterativa workshops utvecklade vi funktioner som sänker trösklar och gör deltagande meningsfullt.",
                color: "text-orange-500"
              },
              {
                icon: Users,
                title: "Prototyptestning",
                description: "Vi testade den första prototypen med familj, vänner och potentiella användare. Feedbacken hjälpte oss förstå användarflöden och förfina funktioner baserat på verkliga behov och förväntningar.",
                color: "text-pink-500"
              }
            ].map((stage, index) => (
              <Card key={index} className="border-2 hover:border-accent/50 transition-all hover:shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className={`h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center shrink-0 ${stage.color}`}>
                      <stage.icon className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{stage.title}</h3>
                      <p className="text-muted-foreground text-lg leading-relaxed">
                        {stage.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Vår lösning</h2>
            <p className="text-xl text-muted-foreground">
              Discovery, understanding, and participation in one place
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="border-2 hover:border-accent/50 transition-all hover:shadow-lg">
              <CardContent className="p-8">
                <MapPin className="h-10 w-10 text-accent mb-4" />
                <h3 className="text-2xl font-bold mb-3">Utforska projekt</h3>
                <p className="text-muted-foreground text-lg mb-4">
                  Genom list- och kartvy gör vi det enkelt att hitta projekt. Filtrera på fas, 
                  område eller sök efter specifika projekt. Allt på ett ställe, visuellt och intuitivt.
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    <span>Interaktiv karta med projektmarkörer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    <span>Sök och filtrera efter dina intressen</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent/50 transition-all hover:shadow-lg">
              <CardContent className="p-8">
                <Globe2 className="h-10 w-10 text-accent mb-4" />
                <h3 className="text-2xl font-bold mb-3">Djupdyk i projekt</h3>
                <p className="text-muted-foreground text-lg mb-4">
                  Varje projektsida svarar på: Vad är detta? Var är det i processen? Vilken tidsram? 
                  Koncis information med länk till original för detaljer.
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    <span>Tydlig tidslinje med projektfaser</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    <span>Nyhetssektion med uppdateringar</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent/50 transition-all hover:shadow-lg">
              <CardContent className="p-8">
                <MessageSquare className="h-10 w-10 text-accent mb-4" />
                <h3 className="text-2xl font-bold mb-3">Engagera dig</h3>
                <p className="text-muted-foreground text-lg mb-4">
                  En lightweight social layer gör det enkelt att visa åsikter. Rösta upp/ner, 
                  kommentera och diskutera med andra. Populära idéer kommer till ytan.
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    <span>Snabba reaktioner och kommentarer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    <span>Community-driven diskussion</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent/50 transition-all hover:shadow-lg">
              <CardContent className="p-8">
                <TrendingUp className="h-10 w-10 text-accent mb-4" />
                <h3 className="text-2xl font-bold mb-3">Påverka direkt</h3>
                <p className="text-muted-foreground text-lg mb-4">
                  När du vill gå längre än kommentarer, skicka strukturerad feedback som följer 
                  Stockholms Stads procedur. Allt i samma kontext – där motivationen är starkast.
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    <span>Strukturerade feedbackformulär</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    <span>Dela egna projektidéer</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="civic-gradient text-primary-foreground border-0">
            <CardContent className="p-8 md:p-12 text-center">
              <Target className="h-16 w-16 mx-auto mb-6 opacity-90" />
              <h3 className="text-3xl font-bold mb-4">Design som sänker trösklar</h3>
              <p className="text-lg text-primary-foreground/90 max-w-3xl mx-auto leading-relaxed">
                Vår designidé bygger på insikten att engagemang sker i stunden. Genom att placera 
                formella kanaler för påverkan direkt där diskussionen sker, skapar vi närhet – både 
                fysisk och emotionell. När motivation och möjlighet sammanfaller ökar sannolikheten 
                för handling dramatiskt.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Technology */}
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Teknologi</h2>

          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">Frontend</h3>
                <ul className="space-y-3 text-muted-foreground text-lg">
                  <li className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    React + TypeScript för typsäkerhet
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    Vite för snabb utveckling
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    Tailwind CSS för modern design
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    Leaflet för interaktiva kartor
                  </li>
                  
                  <li className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    Remote frontend-hosting med Render för enkel skalbarhet
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">Backend</h3>
                <ul className="space-y-3 text-muted-foreground text-lg">
                  <li className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    FastAPI med SQLAlchemy
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    SQLite för utveckling
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    PostgreSQL för produktion
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    Web scraping från Stockholm Växer
                  </li>
                    <li className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    Remote backend-hosting av API med Render för enkel skalbarhet
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8 border-2 border-accent/30 bg-accent/5">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">MVP till skalbar plattform</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Prototypen fokuserar på kärnupplevelsen: hitta projekt, förstå status, och delta. 
                När användning och data växer kan systemet utvecklas utan att ändra sin form – från 
                en-gångs scraping till schemalagd inhämtning, från SQLite till PostgreSQL, och med 
                tillägg av moderering, notifieringar och analytics.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Roadmap */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Framtidsvisionen</h2>
            <p className="text-xl text-muted-foreground">
              Från Stockholm till hela Sverige
            </p>
          </div>

          <div className="space-y-8">
            <Card className="border-2 border-accent/50 bg-accent/5">
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="h-12 w-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center shrink-0 font-bold text-xl">
                    1.0
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Pilotprojekt Stockholm</h3>
                    <p className="text-muted-foreground text-lg mb-4">
                      Första versionen fokuserar på Stockholm med information kopplad till enskilda 
                      projekt, direktkanal för formella synpunkter, och community-funktioner.
                    </p>
                    <ul className="grid md:grid-cols-2 gap-3 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                        <span>Likes, kommentarer, profilsidor</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                        <span>Feedbackkanal till Stockholm</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                        <span>Community projekt-inlägg</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                        <span>Interaktiv karta</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="h-12 w-12 rounded-full bg-muted text-foreground flex items-center justify-center shrink-0 font-bold text-xl">
                    2.0
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Regional expansion</h3>
                    <p className="text-muted-foreground text-lg mb-4">
                      Skalning till Stockholms län och ytterligare regioner med samma kärnfunktioner.
                    </p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Rocket className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <span>Stöd för flera kommuner</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Rocket className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <span>Regional datainfrastruktur</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="h-12 w-12 rounded-full bg-muted text-foreground flex items-center justify-center shrink-0 font-bold text-xl">
                    3.0
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Nationell plattform</h3>
                    <p className="text-muted-foreground text-lg mb-4">
                      Full täckning över Sverige med avancerade funktioner för analys och samarbete.
                    </p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <span>AI-driven sentimentanalys</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <span>Rapporter till kommuner och beslutsfattare</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <span>Integrationer med kommunala system</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Vilka vi är</h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Vi är ett gäng KTH-studenter som vill göra det enklare för medborgare att engagera sig 
            i stadsplaneringen. Vi tror att bättre överblick och lägre trösklar leder till bättre 
            beslut och starkare lokalt engagemang.
          </p>
          
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;