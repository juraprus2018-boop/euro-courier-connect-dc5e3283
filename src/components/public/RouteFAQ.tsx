import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface Props {
  faq: { vraag: string; antwoord: string }[];
}

export function RouteFAQ({ faq }: Props) {
  if (!faq?.length) return null;
  return (
    <section className="py-12">
      <div className="container max-w-4xl">
        <h2 className="font-display text-2xl md:text-3xl font-bold mb-6">
          Veelgestelde vragen
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {faq.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left font-display font-semibold">
                {f.vraag}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {f.antwoord}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
