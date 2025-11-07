import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function TermsModal() {
  const navigate = useNavigate();

  const onOpenChange = (open: boolean) => {
    if (!open) navigate(-1); // closing returns to previous page
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <Dialog open onOpenChange={onOpenChange}>
      {/* 👇 key classes: max height + vertical scroll + nice width */}
      <DialogContent className="w-[92vw] sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        {/* optional: nicer reading with prose */}
        <div className="prose prose-sm sm:prose max-w-none dark:prose-invert">
          <h1>Villkor och uppförandekod för StadsSurr</h1>
          <p>Senast uppdaterad: 2025-11-06</p>
          
      <h2 id="uppforandekod">1. Uppförandekod</h2>
      <p>
        StadsSurr är en plattform för saklig och respektfull dialog kring stadens
        utveckling. Alla användare förväntas bidra till en trygg, inkluderande och
        konstruktiv samtalsmiljö.
      </p>
      <ul>
        <li>
          <strong>Visa respekt:</strong> Håll en saklig och vänlig ton. Personangrepp,
          trakasserier eller nedlåtande kommentarer tolereras inte.
        </li>
        <li>
          <strong>Nolltolerans mot hat:</strong> Inlägg med hat, hot, diskriminering eller
          uppvigling mot individer eller grupper är förbjudna.
        </li>
        <li>
          <strong>Saklighet:</strong> Bidra med fakta, observationer och källor.
          Undvik att sprida vilseledande eller falsk information.
        </li>
        <li>
          <strong>Relevans & integritet:</strong> Håll dig till ämnet. Publicera inte
          känslig personinformation eller material som kan skada enskilda individer.
        </li>
        <li>
          <strong>Moderering:</strong> Inlägg som bryter mot dessa regler kan tas bort
          utan förvarning. Upprepade överträdelser kan leda till att användarkontot
          stängs av.
        </li>
      </ul>

      <h2 id="fromular">2. Inskick av åsikt till Stockholms stad</h2>
      <p>
        Genom att skicka in synpunkter eller idéer via StadsSurr bekräftar du att ditt
        bidrag uttrycks på ett sakligt och respektfullt sätt. Plattformen är avsedd
        för konstruktiv dialog och förbättringsförslag som kan bidra till en bättre
        stadsmiljö.
      </p>
      <ul>
        <li>
          <strong>Innehåll:</strong> Det är inte tillåtet att publicera kränkande, stötande,
          hotfullt eller på annat sätt olämpligt innehåll. Inlägg som bryter mot svensk
          lag, stadens riktlinjer eller dessa villkor kan tas bort utan förvarning.
        </li>
        <li>
          <strong>Ansvar:</strong> Du ansvarar själv för innehållet i det du publicerar.
          Upprepade överträdelser kan leda till att kontot stängs av.
        </li>
        <li>
          <strong>Vidarebefordran till Stockholms stad:</strong> Genom att lämna in ett
          inlägg godkänner du att den information du delar – inklusive text,
          platsangivelse och annan angiven data – kan vidarebefordras till Stockholms
          stad som en del av stadens arbete med att samla in medborgarnas synpunkter.
        </li>
        <li>
          <strong>Hantering av data:</strong> Informationen behandlas enligt gällande
          dataskyddsregler (GDPR) och kan användas som underlag i stadens planerings-
          och beslutsprocesser.
        </li>
        <li>
          <strong>Dialogkvalitet:</strong> Alla åsikter granskas som en del av stadens
          dialogprocess och ska hålla en nivå av saklighet som möjliggör att de kan
          användas som underlag i planeringsarbetet.
        </li>
      </ul>

      <h2 id="kontakt">3. Kontakt & ändringar</h2>
      <ul>
        <li>
          <strong>Kontakt:</strong> För frågor om dessa villkor, rapportering av
          överträdelser eller förslag på förbättringar, kontakta projektteamet bakom
          StadsSurr.
        </li>
        <li>
          <strong>Ändringar:</strong> StadsSurr förbehåller sig rätten att uppdatera eller
          justera villkoren vid behov. Ändringar dokumenteras och publiceras tillsammans
          med en kort beskrivning av vad som ändrats, varför ändringen genomförts samt
          dess påverkan på användare och plattformens funktion.
        </li>
        <li>
          <strong>Godkännande:</strong> Genom fortsatt användning av tjänsten efter att
          uppdaterade villkor har publicerats godkänner du dessa ändringar.
        </li>
      </ul>


          {/* <h2 id="syfte">1. Syfte</h2>
          <p>
            Att ta fram och utvärdera en MVP som gör stadens projekt lätta att hitta, förstå och påverka. 
            Dokumentet klargör mål, omfattning, teknikval, datahantering och grundläggande regler för deltagande.
          </p>

          <h2 id="omfattning">2. Omfattning (MVP)</h2>
          <ul>
            <li>Projektutforskning: listvy (sök/filtrera) och kartvy (markörer med popups).</li>
            <li>Projektsida: kort beskrivning, status/fas, tidslinje samt nyhetsuppdateringar med källor.</li>
            <li>Socialt lager: reaktioner (upp/ner), kommentarer med gilla.</li>
            <li>Strukturerad feedback: formulär som skickas vidare/arkiveras med projekt- och platskontext.</li>
            <li>Community-projekt: användare kan publicera egna idéer i separat flöde.</li>
            <li>Utanför scope (MVP): avancerad moderering, realtidsintegrationer, fullskalig analys.</li>
          </ul>

          <h2 id="teknik">3. Teknik</h2>
          <ul>
            <li>Frontend: React + TypeScript + Vite, Tailwind för stil.</li>
            <li>Backend: FastAPI + SQLAlchemy; SQLite i utveckling.</li>
            <li>Karta: Leaflet med WGS84-koordinater (konverterade i ingest).</li>
            <li>API-yta: få, tydliga endpoints (listor, detaljer, GeoJSON, kommentarer/reaktioner, feedback).</li>
          </ul>

          <h2 id="data">4. Data, källor och efterlevnad</h2>
          <ul>
            <li>Källa (MVP): engångsinhämtning från offentligt material (Stockholm Växer) för prototyp.</li>
            <li>Transparens: visa alltid källa och “senast uppdaterad”.</li>
            <li>Regelefterlevnad: respektera robots.txt; när schemalagd inhämtning införs ska klient identifieras artigt och anrop throttlas.</li>
            <li>Bildrättigheter: återpublicera inte material utan klar licens; länka till original.</li>
            <li>Personuppgifter (GDPR): minimera insamling, begränsa ändamål/lagringstid, informera användare tydligt.</li>
          </ul> */}

          {/* <h2 id="uppforandekod">Uppförandekod</h2>
          <ul>
            <li>Visa respekt: sakligt och vänligt bemötande; inga personangrepp eller trakasserier.</li>
            <li>Nolltolerans mot hat: inget hat, hot eller uppvigling mot individer eller grupper.</li>
            <li>Saklighet: bidra med observationer och källor; undvik vilseledande information.</li>
            <li>Relevans & integritet: håll dig till sakfrågan; publicera inte känslig personinformation.</li>
            <li>Moderering: innehåll kan tas bort vid överträdelse; upprepade fall kan leda till avstängning.</li>
          </ul> */}

          {/* <h2 id="krav">6. Praktiska krav (MVP)</h2>
          <ul>
            <li>Drift i utveckling: klient på 8080, backend på 8000; seedad databas.</li>
            <li>Tillgänglighet: grundläggande webbtillgänglighet i UI (kontrast, semantik, tangentbordsnavigering).</li>
            <li>Säkerhet (bas): sanera indata i formulär; logga fel; CORS begränsas till dev-domäner.</li>
          </ul>

          <h2 id="acceptans">7. Godkännandekriterier</h2>
          <ul>
            <li>En användare kan på &lt;2 min hitta ett projekt, se fas/tidslinje och nyheter med källa.</li>
            <li>Karta och lista laddar utan blockerande fel med seedad data; UI responsivt.</li>
            <li>Reaktioner/kommentarer fungerar och går att moderera grundläggande (ta bort/rapportera).</li>
            <li>Feedback kan skickas med kontext (projekt, plats, tid) och synlig bekräftelse i UI.</li>
          </ul> */}

          {/* <h2 id="fromular">Inskick av åsikt till Stockholms stad</h2>
          <p>
            
          </p>

          <h2 id="kontakt">Kontakt & ändringar</h2>
          <p>
            För frågor om ToR, rapportering av brister eller förslag på ändringar, kontakta projektteamet.
            Ändringar av scope eller regler dokumenteras kort (vad/varför/påverkan) innan implementering.
          </p> */}
        </div>
      </DialogContent>
    </Dialog>
  );
}

