import { Globe2 } from 'lucide-react';
import { ServicePageLayout } from '@/components/public/ServicePageLayout';

const InternationaalTransportPage = () => (
  <ServicePageLayout
    metaTitle="Internationaal transport | De Europa Koerier"
    metaDescription="Internationaal koerierstransport vanuit Nederland naar heel Europa. Direct van A naar B, 24/7 beschikbaar. Vraag uw offerte aan."
    badge="Internationaal transport"
    title="Internationaal transport door heel Europa"
    intro="Van Nederland naar elke uithoek van Europa. Met onze eigen vloot bestelwagens en bakwagens met laadklep verzorgen wij directe ritten naar alle EU-landen, zonder overslag en zonder vertraging."
    icon={Globe2}
    features={[
      { title: 'Direct van A naar B', description: 'Geen overslag of distributiecentra. Uw zending blijft van ophaal tot aflevering bij dezelfde koerier.' },
      { title: 'Heel Europa', description: 'België, Duitsland, Frankrijk, Spanje, Italië, Polen, Verenigd Koninkrijk en alle andere EU-landen.' },
      
      { title: 'Eigen koeriers', description: 'Wij werken met vaste, ervaren chauffeurs die de internationale routes door en door kennen.' },
      { title: '24/7 beschikbaar', description: 'Spoedrit nodig in het weekend of midden in de nacht? Wij staan altijd voor u klaar.' },
      { title: 'Track & trace', description: 'Op verzoek houden wij u realtime op de hoogte van de status van uw zending.' },
    ]}
  >
    <h2>Internationaal vervoer met vast aanspreekpunt</h2>
    <p className="text-muted-foreground">
      Bij een rit naar het buitenland telt elk uur. Onze chauffeurs rijden vaste routes door
      Europa en weten hoe het werkt aan de grens. U heeft één vast aanspreekpunt en dezelfde
      chauffeur die de zending ophaalt, levert hem ook af.
    </p>
    <p className="text-muted-foreground">
      Spoedrit naar Parijs, zending naar Madrid of transport naar Warschau – we plannen het in
      en vertrekken zo snel mogelijk. Onze bestelwagens en bakwagens met laadklep hebben
      GPS-tracking en zijn geschikt voor zendingen tot enkele honderden kilo's.
    </p>
  </ServicePageLayout>
);

export default InternationaalTransportPage;
