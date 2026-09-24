// The deals of the Chocolife and BeSmart screen. Venues and prices are made up; the kinds of deals are the
// ones both sites sold: a day out, a spa, food, sport. BeSmart.kg sells the same deals in Kyrgyzstan, in som.

export type Brand = 'chocolife' | 'besmart';
export type Market = 'kz' | 'kg';
export type Category = 'all' | 'food' | 'beauty' | 'fun' | 'travel';

export type Option = { id: string; label: string; price: number; old: number };

export type Deal = {
  id: string;
  title: string;
  category: Exclude<Category, 'all'>;
  emoji: string;
  /** Background of the picture, one of the category colors of the Chocolife feed. */
  tint: string;
  venue: string;
  address: string;
  options: Option[];
  bought: number;
  /** Hours until the deal ends, counted from the moment the page opens. */
  endsIn: number;
  terms: string[];
};

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all', label: 'All deals' },
  { id: 'food', label: 'Food' },
  { id: 'beauty', label: 'Beauty' },
  { id: 'fun', label: 'Fun' },
  { id: 'travel', label: 'Travel' },
];

export const deals: Deal[] = [
  {
    id: 'aquapark',
    title: 'A day at the aquapark',
    category: 'fun',
    emoji: '🌊',
    tint: '#e3f4ff',
    venue: 'Aqua Planet',
    address: '77 Al-Farabi Avenue',
    options: [
      { id: 'adult', label: 'Adult ticket', price: 5688, old: 11376 },
      { id: 'child', label: 'Child ticket, 4 to 12 years', price: 3900, old: 7800 },
      { id: 'family', label: 'Family: two adults, two children', price: 16500, old: 33000 },
    ],
    bought: 1234,
    endsIn: 51,
    terms: ['Valid every day until the end of the season', 'Towel and locker included', 'Show the coupon at the entrance'],
  },
  {
    id: 'spa',
    title: 'Spa day for two',
    category: 'beauty',
    emoji: '💆',
    tint: '#f5ecff',
    venue: 'Lotus Spa',
    address: '12 Dostyk Avenue',
    options: [
      { id: 'weekday', label: 'Monday to Thursday', price: 14900, old: 29800 },
      { id: 'weekend', label: 'Friday to Sunday', price: 18900, old: 37800 },
    ],
    bought: 386,
    endsIn: 27,
    terms: ['Book by phone a day ahead', 'Sauna, pool and a 60-minute massage', 'Show the coupon at the reception'],
  },
  {
    id: 'sushi',
    title: 'Sushi sets at half price',
    category: 'food',
    emoji: '🍣',
    tint: '#fffbe7',
    venue: 'Tokyo Roll',
    address: '5 Abay Avenue',
    options: [
      { id: 'small', label: 'Set of 32 pieces', price: 4450, old: 8900 },
      { id: 'large', label: 'Set of 64 pieces', price: 8200, old: 16400 },
    ],
    bought: 2917,
    endsIn: 9,
    terms: ['Delivery or pickup', 'Name the coupon code when you order', 'One coupon per order'],
  },
  {
    id: 'bowling',
    title: 'An hour of bowling',
    category: 'fun',
    emoji: '🎳',
    tint: '#fdeeee',
    venue: 'Strike Club',
    address: '140 Rozybakiev Street',
    options: [{ id: 'lane', label: 'One lane, up to 6 players', price: 6000, old: 12000 }],
    bought: 742,
    endsIn: 70,
    terms: ['Every day before 18:00', 'Shoes included', 'Book a lane by phone'],
  },
  {
    id: 'ski',
    title: 'Day ski pass in the mountains',
    category: 'travel',
    emoji: '⛷️',
    tint: '#e3f4ff',
    venue: 'Snow Peak Resort',
    address: 'Gorge road, 25 km',
    options: [
      { id: 'pass', label: 'Day pass', price: 9900, old: 18000 },
      { id: 'rent', label: 'Day pass and equipment', price: 15900, old: 29000 },
    ],
    bought: 518,
    endsIn: 38,
    terms: ['Valid from December to March', 'Lifts from 9:00 to 17:00', 'Show the coupon at the ticket office'],
  },
  {
    id: 'pizza',
    title: 'Two pizzas for the price of one',
    category: 'food',
    emoji: '🍕',
    tint: '#fef0e5',
    venue: 'Forno',
    address: '33 Tole Bi Street',
    options: [{ id: 'two', label: 'Two large pizzas', price: 3290, old: 6580 }],
    bought: 3605,
    endsIn: 15,
    terms: ['Dine in or pickup', 'Any pizza from the menu', 'Show the coupon to the waiter'],
  },
];

export const MARKETS: Record<Market, { domain: string; currency: string; rate: number; cities: string[] }> = {
  kz: { domain: 'kz', currency: '₸', rate: 1, cities: ['Almaty', 'Astana', 'Shymkent'] },
  kg: { domain: 'kg', currency: 'som', rate: 0.18, cities: ['Bishkek', 'Osh'] },
};

/** A price in the market's money, with thin spaces between thousands: "5 688 ₸", "1 020 som". */
export function money(amount: number, market: Market) {
  const { rate, currency } = MARKETS[market];
  const value = market === 'kz' ? amount : Math.round((amount * rate) / 10) * 10;
  return `${value.toLocaleString('en-US').replace(/,/g, ' ')} ${currency}`;
}

/** Coupons other buyers already hold for a deal, as the partner cabinet lists them. */
export function soldBefore(deal: Deal, brand: Brand) {
  const prefix = brand === 'chocolife' ? 'CL' : 'BS';
  return [
    { code: `${prefix}-3190-7741`, option: deal.options[0].label, at: '09:12', redeemed: '10:05' },
    { code: `${prefix}-3204-1186`, option: deal.options.at(-1)!.label, at: '09:47', redeemed: null },
    { code: `${prefix}-3217-5520`, option: deal.options[0].label, at: '10:31', redeemed: '11:58' },
    { code: `${prefix}-3229-0934`, option: deal.options[0].label, at: '11:02', redeemed: null },
  ];
}
