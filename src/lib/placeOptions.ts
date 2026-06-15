export type PlaceOption = {
  naam: string;
  lat: number;
  lon: number;
};

export const NL_PLACE_OPTIONS: PlaceOption[] = [
  { naam: 'Amsterdam', lat: 52.3676, lon: 4.9041 },
  { naam: 'Rotterdam', lat: 51.9225, lon: 4.4792 },
  { naam: 'Den Haag', lat: 52.0705, lon: 4.3007 },
  { naam: 'Utrecht', lat: 52.0907, lon: 5.1214 },
  { naam: 'Eindhoven', lat: 51.4416, lon: 5.4697 },
  { naam: 'Groningen', lat: 53.2194, lon: 6.5665 },
  { naam: 'Tilburg', lat: 51.5555, lon: 5.0913 },
  { naam: 'Almere', lat: 52.3508, lon: 5.2647 },
  { naam: 'Breda', lat: 51.5719, lon: 4.7683 },
  { naam: 'Nijmegen', lat: 51.8126, lon: 5.8372 },
  { naam: 'Enschede', lat: 52.2215, lon: 6.8937 },
  { naam: 'Haarlem', lat: 52.3874, lon: 4.6462 },
  { naam: 'Arnhem', lat: 51.9851, lon: 5.8987 },
  { naam: 'Zaandam', lat: 52.4385, lon: 4.8264 },
  { naam: 'Amersfoort', lat: 52.1561, lon: 5.3878 },
  { naam: 'Apeldoorn', lat: 52.2112, lon: 5.9699 },
  { naam: "'s-Hertogenbosch", lat: 51.6978, lon: 5.3037 },
  { naam: 'Hoofddorp', lat: 52.3061, lon: 4.6907 },
  { naam: 'Maastricht', lat: 50.8514, lon: 5.6910 },
  { naam: 'Leiden', lat: 52.1601, lon: 4.4970 },
  { naam: 'Helmond', lat: 51.4817, lon: 5.6611 },
];

export const COUNTRY_CITY_OPTIONS: Record<string, PlaceOption[]> = {
  kroatie: [
    { naam: 'Zagreb', lat: 45.8150, lon: 15.9819 },
    { naam: 'Split', lat: 43.5081, lon: 16.4402 },
    { naam: 'Rijeka', lat: 45.3271, lon: 14.4422 },
    { naam: 'Osijek', lat: 45.5511, lon: 18.6939 },
    { naam: 'Zadar', lat: 44.1194, lon: 15.2314 },
    { naam: 'Pula', lat: 44.8666, lon: 13.8496 },
    { naam: 'Slavonski Brod', lat: 45.1603, lon: 18.0156 },
    { naam: 'Karlovac', lat: 45.4929, lon: 15.5553 },
    { naam: 'Varaždin', lat: 46.3057, lon: 16.3366 },
    { naam: 'Šibenik', lat: 43.7350, lon: 15.8952 },
    { naam: 'Dubrovnik', lat: 42.6507, lon: 18.0944 },
    { naam: 'Sisak', lat: 45.4879, lon: 16.3753 },
    { naam: 'Vinkovci', lat: 45.2883, lon: 18.8057 },
    { naam: 'Vukovar', lat: 45.3431, lon: 19.0000 },
    { naam: 'Bjelovar', lat: 45.8986, lon: 16.8423 },
    { naam: 'Koprivnica', lat: 46.1635, lon: 16.8339 },
    { naam: 'Požega', lat: 45.3403, lon: 17.6853 },
    { naam: 'Samobor', lat: 45.8031, lon: 15.7181 },
    { naam: 'Čakovec', lat: 46.3844, lon: 16.4339 },
    { naam: 'Virovitica', lat: 45.8319, lon: 17.3839 },
  ],
};