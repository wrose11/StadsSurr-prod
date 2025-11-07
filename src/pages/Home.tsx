import { Link } from "react-router-dom";
import { MessageSquare, TrendingUp, Users, Building2, ArrowRight, Compass } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import logo from "@/assets/logo.png";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero section */}
      <section className="relative overflow-hidden">
        <div className="civic-gradient-subtle absolute inset-0" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-4xl mx-auto text-center">
            <img src={logo} alt="StadsSurr" className="h-20 mx-auto mb-8" />
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              Din röst formar Stockholm
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              StadsSurr är Stockholms plattform för medborgarengagemang i stadsplanering. 
              Se projekt, dela åsikter och påverka beslut som formar din stad.
            </p>
            <div className="flex flex-col gap-4 justify-center max-w-xl mx-auto">
              <Button asChild size="lg" variant="accent" className="gap-3 h-16 md:h-20 font-bold hover-scale shadow-lg hover:shadow-xl transition-all group py-4">
                <Link to="/utforska" className="flex items-center justify-center text-xl md:text-2xl">
                  <Compass className="h-6 w-6 md:h-8 md:w-8 transition-transform duration-500 group-hover:rotate-180" />
                  Utforska
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-3 h-16 md:h-20 font-bold hover-scale shadow-lg hover:shadow-xl transition-all border-2 py-4 group">
                <Link to="/about" className="flex items-center justify-center text-xl md:text-2xl">
                  Om oss
                  <ArrowRight className="h-6 w-6 md:h-8 md:w-8 transition-transform duration-300 group-hover:translate-x-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      

            {/* Features section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Hur StadsSurr fungerar</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            En transparent process för att engagera dig i stadens utveckling
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="border-2 hover:border-accent/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>Se projekt</CardTitle>
              <CardDescription>
                Utforska pågående och planerade byggprojekt i hela Stockholm
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-accent/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>Kommentera</CardTitle>
              <CardDescription>
                Ställ frågor och dela dina åsikter direkt med beslutsfattare
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-accent/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>Rösta</CardTitle>
              <CardDescription>
                Visa ditt stöd eller din opposition för olika projekt och förslag
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-accent/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>Påverka</CardTitle>
              <CardDescription>
                Din input samlas och delas med politiker och stadsplanerare
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>


      {/* CTA section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="civic-gradient text-primary-foreground border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Börja påverka din stad idag
            </h2>
            <p className="text-primary-foreground/90 mb-8 text-lg max-w-2xl mx-auto">
              Gå med i StadsSurr för att göra din röst hörd
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary">
                <Link to="/projects">
                  Se alla projekt
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/create-account">
                  Skapa konto
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

    </div>
  );
};

export default Home;
