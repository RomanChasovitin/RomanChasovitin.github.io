import { useEffect, useRef, useState, type ReactNode } from 'react';
import Window from '../../components/Window';
import { CATEGORIES, deals, MARKETS, money, soldBefore, type Brand, type Category, type Deal, type Market } from './deals';

// The life of a coupon, in one browser window whose five tabs are its five steps: pick a deal in the feed,
// choose an option, pay, get the coupon by email, and redeem it in the partner cabinet at the venue. The two
// icons over the top left corner of the window run the same loop in the other brand: Chocolife or BeSmart,
// and BeSmart in two countries. The device button in the address bar shows every page at phone width, email included;
// a narrow window is at phone width already and has no such button.

type Order = {
  id: number;
  brand: Brand;
  market: Market;
  deal: string;
  option: string;
  quantity: number;
  code: string;
  email: string;
  at: string;
  redeemed: string | null;
  read: boolean;
};
type Stage = 'feed' | 'deal' | 'checkout' | 'coupon' | 'redeem';

const STAGES: { id: Stage; label: string }[] = [
  { id: 'feed', label: 'Feed' },
  { id: 'deal', label: 'Deal' },
  { id: 'checkout', label: 'Checkout' },
  { id: 'coupon', label: 'Coupon' },
  { id: 'redeem', label: 'Redeem' },
];

// Navy for Chocolife, the blue of the BeSmart logo for BeSmart.
const stepIcon = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" style={{ stroke: 'var(--step-icon, #2e3a82)' }} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const STEP_ICONS: Record<Stage, ReactNode> = {
  feed: stepIcon('M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z'),
  deal: stepIcon('M3 12V4h8l10 10-8 8zM7.5 8.5h.01'),
  checkout: stepIcon('M3 6h18v12H3zM3 10h18M7 15h4'),
  coupon: stepIcon('M3 6h18v12H3zM3 7l9 7 9-7'),
  redeem: stepIcon('M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3M8 12l3 3 5-6'),
};

// BeSmart takes the blue and the yellow of its logo. `bar` is the color of the top of its emails, and for
// BeSmart of the store header too.
const SKIN: Record<Brand, { name: string; accent: string; onAccent: string; ink: string; badge: string; bar: string; font: string; partnerBar: string }> = {
  chocolife: { name: 'Chocolife', accent: '#f7da3b', onAccent: '#212121', ink: '#2e3a82', badge: '#e31e24', bar: '#f7da3b', font: 'font-roboto', partnerBar: '#2e3a82' },
  besmart: { name: 'BeSmart', accent: '#eab825', onAccent: '#10284a', ink: '#104780', badge: '#104780', bar: '#104780', font: 'font-lato', partnerBar: '#0b3563' },
};

const domain = (brand: Brand, market: Market) => (brand === 'chocolife' ? 'chocolife.me' : `besmart.${MARKETS[market].domain}`);
const dealOf = (id: string) => deals.find((deal) => deal.id === id)!;
const optionOf = (order: Order) => dealOf(order.deal).options.find((option) => option.id === order.option)!;
const clock = (date = new Date()) => date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const pad = (value: number) => String(value).padStart(2, '0');
/** Thousands with a thin space, as in prices. */
const count = (value: number) => value.toLocaleString('en-US').replace(/,/g, '\u202f');

function left(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const rest = `${pad(Math.floor((total % 86400) / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
  return days ? `${days} d ${rest}` : rest;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const digits = (value: string) => value.replace(/\D/g, '');

let nextOrder = 0;

export default function Shop() {
  const [step, setStep] = useState<Stage>('feed');
  const [store, setStore] = useState<Brand>('chocolife');
  const [market, setMarket] = useState<Market>('kz');
  const [chosen, setChosen] = useState<Record<Brand, string>>({ chocolife: deals[0].id, besmart: deals[0].id });
  /** The order a checkout has just paid for, per brand; the Checkout tab shows it until the next purchase. */
  const [paid, setPaid] = useState<Record<Brand, number | null>>({ chocolife: null, besmart: null });
  const [category, setCategory] = useState<Category>('all');
  const [option, setOption] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [form, setForm] = useState({ email: 'you@example.com', phone: '+7 701 555 12 34', card: '4242 4242 4242 4242' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [mail, setMail] = useState<number | null>(null);
  const [mobile, setMobile] = useState(false);
  const [bought, setBought] = useState<Record<string, number>>(() => Object.fromEntries(deals.map((deal) => [deal.id, deal.bought])));
  const [redeemedBefore, setRedeemedBefore] = useState<Record<string, string>>({});
  const [now, setNow] = useState(() => Date.now());
  const opened = useRef(Date.now());
  const scroller = useRef<HTMLDivElement>(null);

  // Deal timers count down, and other buyers keep buying.
  useEffect(() => {
    let beat = 0;
    const timer = setInterval(() => {
      setNow(Date.now());
      if (++beat % 3 === 0) {
        const deal = deals[(beat / 3) % deals.length];
        setBought((all) => ({ ...all, [deal.id]: all[deal.id] + 1 }));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [step, store]);

  // The whole screen wears the brand of the store: its background and the color of the slogan.
  useEffect(() => {
    document.getElementById('chocolife')?.setAttribute('data-brand', store);
  }, [store]);

  const skin = SKIN[store];
  const storeMarket: Market = store === 'chocolife' ? 'kz' : market;
  const dealId = chosen[store];
  const unread = orders.filter((order) => !order.read).length;
  const latestOf = (brand: Brand) => [...orders].reverse().find((order) => order.brand === brand);
  const receipt = paid[store] === null ? null : orders.find((order) => order.id === paid[store]) ?? null;

  const openDeal = (id: string) => {
    setChosen((all) => ({ ...all, [store]: id }));
    setQuantity(1);
    setStep('deal');
  };

  function place(id: string, brand = store) {
    const deal = dealOf(id);
    const next = nextOrder++;
    const prefix = brand === 'chocolife' ? 'CL' : 'BS';
    const order: Order = {
      id: next,
      brand,
      market: brand === 'chocolife' ? 'kz' : market,
      deal: id,
      option: option[id] ?? deal.options[0].id,
      quantity,
      code: `${prefix}-${4827 + next * 13}-${String((1953 + next * 377) % 10000).padStart(4, '0')}`,
      email: form.email,
      at: clock(),
      redeemed: null,
      read: false,
    };
    setOrders((all) => [...all, order]);
    setBought((all) => ({ ...all, [id]: all[id] + quantity }));
    return order;
  }

  function pay(id: string) {
    const found: Record<string, string> = {};
    if (!EMAIL.test(form.email)) found.email = 'Enter an email: the coupon goes there.';
    if (digits(form.phone).length !== 11) found.phone = 'A phone number has 11 digits, with the country code.';
    if (digits(form.card).length !== 16) found.card = 'A card number has 16 digits.';
    setErrors(found);
    if (Object.keys(found).length) return;
    setPaying(true);
    setTimeout(() => {
      const order = place(id);
      setPaying(false);
      setPaid((all) => ({ ...all, [store]: order.id }));
    }, 1200);
  }

  function openMail(id?: number) {
    const target = id ?? orders.at(-1)?.id ?? null;
    setMail(target);
    if (target !== null) setOrders((all) => all.map((order) => (order.id === target ? { ...order, read: true } : order)));
    setStep('coupon');
  }

  function jump(to: Stage) {
    // The coupon and the venue need a purchase; without one, this buys the deal on screen.
    if (to === 'coupon' || to === 'redeem') {
      const order = latestOf(store) ?? place(dealId);
      if (to === 'coupon') openMail(order.id);
      else setStep('redeem');
      return;
    }
    setStep(to);
  }

  function redeem(code: string) {
    const at = clock();
    const own = orders.find((order) => order.code === code);
    if (own) setOrders((all) => all.map((order) => (order.code === code ? { ...order, redeemed: at } : order)));
    else setRedeemedBefore((all) => ({ ...all, [code]: at }));
  }

  const site = domain(store, storeMarket);
  const url = {
    feed: `${site}/${MARKETS[storeMarket].cities[0].toLowerCase()}`,
    deal: `${site}/deal/${dealId}`,
    checkout: `${site}/checkout${receipt ? '/done' : ''}`,
    coupon: 'mail.example.com/inbox',
    redeem: `partner.${site}/coupons`,
  }[step];

  return (
    <div className="relative h-full">
      {/* Outside the window, so the window sits where every other window does. */}
      <div className="absolute bottom-full left-0 mb-2.5 flex gap-2" role="group" aria-label="Brand">
        {(['chocolife', 'besmart'] as Brand[]).map((brand) => (
          <button
            key={brand}
            type="button"
            aria-pressed={store === brand}
            aria-label={brand === 'chocolife' ? 'Chocolife.me' : `BeSmart.${MARKETS[market].domain}`}
            title={brand === 'chocolife' ? 'Chocolife.me' : `BeSmart.${MARKETS[market].domain}`}
            onClick={() => setStore(brand)}
            className="cursor-pointer rounded-lg p-0.5 opacity-55 ring-2 ring-transparent transition hover:opacity-100 aria-pressed:opacity-100 aria-pressed:ring-(--cl-heading)"
          >
            <img src={brand === 'chocolife' ? '/icons/chocolife.png' : '/icons/besmart.svg'} alt="" width="64" height="64" className="block size-8 rounded-md" />
          </button>
        ))}
      </div>

      <div className={`h-full ${store === 'besmart' ? '[--step-icon:#1a6bc6]' : ''}`}>
        <Window
          tabs={STAGES.map((item) => ({
            id: item.id,
            label: item.label,
            icon: STEP_ICONS[item.id],
            badge: item.id === 'coupon' && unread > 0 ? <span className="ml-auto rounded-full bg-[#d93025] px-1.5 text-[0.65rem] font-bold text-white">{unread}</span> : undefined,
          }))}
          active={step}
          onTab={(id) => jump(id as Stage)}
          url={url}
          tools={
            <button
              type="button"
              aria-pressed={mobile}
              aria-label={mobile ? 'Show at desktop width' : 'Show at phone width'}
              onClick={() => setMobile((value) => !value)}
              className="flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.75rem] text-[#5f6368] hover:bg-[#f1f3f4] aria-pressed:bg-cl-navy aria-pressed:text-white @max-lg/window:hidden"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                {mobile ? <rect x="3" y="5" width="18" height="12" rx="1.5" /> : <rect x="7" y="2.5" width="10" height="19" rx="2" />}
                {mobile ? <path d="M1 20h22" /> : <path d="M11 18.5h2" />}
              </svg>
              {mobile ? 'Desktop' : 'Phone'}
            </button>
          }
        >
          <div ref={scroller} className={`min-h-0 flex-1 overflow-y-auto ${mobile ? 'bg-[#e9e9ec] py-4' : ''}`}>
            <div className={`@container min-h-full ${mobile ? 'mx-auto w-[390px] max-w-full overflow-hidden rounded-[1.6rem] border-[6px] border-[#1f1f1f] bg-white' : ''}`}>
              {step === 'coupon' ? (
                <Mail orders={orders} selected={mail} onSelect={openMail} />
              ) : step === 'redeem' ? (
                <Partner brand={store} deal={dealOf(latestOf(store)?.deal ?? dealId)} orders={orders} redeemedBefore={redeemedBefore} onRedeem={redeem} />
              ) : (
                <div className={`${skin.font} text-cl-ink`}>
                  <StoreHeader brand={store} market={storeMarket} onMarket={setMarket} onHome={() => setStep('feed')} orders={orders.filter((order) => order.brand === store).length} />
                  {step === 'feed' && (
                    <Feed
                      brand={store}
                      market={storeMarket}
                      category={category}
                      onCategory={setCategory}
                      bought={bought}
                      ends={(deal) => left(opened.current + deal.endsIn * 3600_000 - now)}
                      onOpen={openDeal}
                    />
                  )}
                  {step === 'deal' && (
                    <DealPage
                      brand={store}
                      market={storeMarket}
                      deal={dealOf(dealId)}
                      option={option[dealId] ?? dealOf(dealId).options[0].id}
                      onOption={(id) => setOption((all) => ({ ...all, [dealId]: id }))}
                      quantity={quantity}
                      onQuantity={setQuantity}
                      bought={bought[dealId]}
                      ends={left(opened.current + dealOf(dealId).endsIn * 3600_000 - now)}
                      onBack={() => setStep('feed')}
                      onBuy={() => {
                        setPaid((all) => ({ ...all, [store]: null }));
                        setStep('checkout');
                      }}
                    />
                  )}
                  {step === 'checkout' &&
                    (receipt ? (
                      <Paid brand={store} order={receipt} onMail={() => openMail(receipt.id)} onFeed={() => setStep('feed')} />
                    ) : (
                      <Checkout
                        brand={store}
                        market={storeMarket}
                        deal={dealOf(dealId)}
                        option={option[dealId] ?? dealOf(dealId).options[0].id}
                        quantity={quantity}
                        form={form}
                        errors={errors}
                        paying={paying}
                        onField={(key, value) => setForm((all) => ({ ...all, [key]: value }))}
                        onPay={() => pay(dealId)}
                        onBack={() => setStep('deal')}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
        </Window>
      </div>
    </div>
  );
}

function Button({ brand, children, onClick, disabled, wide }: { brand: Brand; children: ReactNode; onClick?: () => void; disabled?: boolean; wide?: boolean }) {
  const skin = SKIN[brand];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer rounded-md px-5 py-2.5 font-medium transition-[filter] hover:brightness-95 disabled:cursor-default disabled:opacity-60 ${wide ? 'w-full' : ''}`}
      style={{ background: skin.accent, color: skin.onAccent }}
    >
      {children}
    </button>
  );
}

function Logo({ brand }: { brand: Brand }) {
  return brand === 'chocolife' ? (
    <img src="/icons/chocolife-logo.svg" alt="Chocolife.me" width="125" height="23" className="h-5 w-auto" />
  ) : (
    <span className="flex items-center gap-2 text-lg font-black text-white">
      <img src="/icons/besmart.svg" alt="" className="size-7 rounded-md ring-2 ring-white/40" />
      BeSmart
    </span>
  );
}

function StoreHeader({ brand, market, onMarket, onHome, orders }: { brand: Brand; market: Market; onMarket: (market: Market) => void; onHome: () => void; orders: number }) {
  const blue = brand === 'besmart';
  return (
    <header className={`flex items-center gap-3 px-4 py-3 @2xl:px-6 ${blue ? 'text-white' : 'border-b border-[#eee]'}`} style={blue ? { background: SKIN.besmart.bar } : undefined}>
      <button type="button" onClick={onHome} className="cursor-pointer" aria-label="All deals">
        <Logo brand={brand} />
      </button>
      <select
        aria-label="City"
        className={`rounded border px-2 py-1 text-sm ${blue ? 'border-white/40 bg-transparent text-white' : 'border-[#ddd] bg-white text-cl-ink'}`}
        defaultValue={MARKETS[market].cities[0]}
        key={market}
      >
        {MARKETS[market].cities.map((city) => (
          <option key={city} className="text-cl-ink">
            {city}
          </option>
        ))}
      </select>
      {blue && (
        <span className="hidden rounded border border-white/40 text-xs @xl:flex">
          {(['kz', 'kg'] as Market[]).map((value) => (
            <button key={value} type="button" aria-pressed={market === value} onClick={() => onMarket(value)} className="cursor-pointer px-2 py-1 aria-pressed:bg-white aria-pressed:text-[#104780]">
              besmart.{value}
            </button>
          ))}
        </span>
      )}
      <span className={`ml-auto hidden flex-1 items-center rounded-md px-3 py-1.5 text-sm @3xl:flex ${blue ? 'bg-white/15 text-white/80' : 'bg-cl-grey text-cl-muted'}`}>Search deals</span>
      <span className="ml-auto text-sm @3xl:ml-0">
        My coupons <b className="ml-1 rounded px-1.5 py-0.5 text-xs" style={{ background: blue ? SKIN.besmart.accent : SKIN.chocolife.accent, color: blue ? SKIN.besmart.onAccent : '#212121' }}>{orders}</b>
      </span>
    </header>
  );
}

function Picture({ deal, className = '' }: { deal: Deal; className?: string }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`} style={{ background: deal.tint }} aria-hidden="true">
      <span className="absolute -right-6 -bottom-8 size-28 rounded-full bg-white/50" />
      <span className="relative text-[3.2rem]">{deal.emoji}</span>
    </div>
  );
}

function Discount({ brand, deal }: { brand: Brand; deal: Deal }) {
  const cut = Math.round((1 - deal.options[0].price / deal.options[0].old) * 100);
  return (
    <span className="rounded px-1.5 py-0.5 text-xs font-bold text-white" style={{ background: SKIN[brand].badge }}>
      −{cut}%
    </span>
  );
}

function Feed({ brand, market, category, onCategory, bought, ends, onOpen }: { brand: Brand; market: Market; category: Category; onCategory: (category: Category) => void; bought: Record<string, number>; ends: (deal: Deal) => string; onOpen: (id: string) => void }) {
  const shown = deals.filter((deal) => category === 'all' || deal.category === category);
  return (
    <div className="px-4 pt-4 pb-6 @2xl:px-6">
      <h3 className="text-xl font-bold" style={{ color: SKIN[brand].ink }}>
        Deals in {MARKETS[market].cities[0]}
      </h3>
      <div className="mt-3 flex gap-1.5 overflow-x-auto text-sm">
        {CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={category === item.id}
            onClick={() => onCategory(item.id)}
            className="shrink-0 cursor-pointer rounded-full border border-[#e3e3e3] px-3 py-1 text-cl-ink aria-pressed:border-transparent aria-pressed:font-medium"
            style={category === item.id ? { background: SKIN[brand].accent, color: SKIN[brand].onAccent } : undefined}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-4 @lg:grid-cols-2 @3xl:grid-cols-3">
        {shown.map((deal) => (
          <button key={deal.id} type="button" onClick={() => onOpen(deal.id)} className="group cursor-pointer overflow-hidden rounded-xl border border-[#eee] bg-white text-left transition-shadow hover:shadow-md">
            <div className="relative">
              <Picture deal={deal} className="h-32" />
              <span className="absolute top-2.5 left-2.5">
                <Discount brand={brand} deal={deal} />
              </span>
              <span className="absolute right-2.5 bottom-2.5 rounded bg-black/55 px-1.5 py-0.5 font-mono text-[0.7rem] text-white tabular-nums">{ends(deal)}</span>
            </div>
            <div className="p-3">
              <p className="font-medium group-hover:underline">{deal.title}</p>
              <p className="mt-0.5 text-xs text-cl-muted">{deal.venue}</p>
              <p className="mt-2 flex items-baseline gap-2">
                <b className="text-lg">{money(deal.options[0].price, market)}</b>
                <s className="text-xs text-cl-muted">{money(deal.options[0].old, market)}</s>
              </p>
              <p className="mt-1 text-xs text-cl-muted tabular-nums">Bought {count(bought[deal.id])} times</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function DealPage(props: {
  brand: Brand;
  market: Market;
  deal: Deal;
  option: string;
  onOption: (id: string) => void;
  quantity: number;
  onQuantity: (value: number) => void;
  bought: number;
  ends: string;
  onBack: () => void;
  onBuy: () => void;
}) {
  const { brand, market, deal, quantity } = props;
  const chosen = deal.options.find((option) => option.id === props.option)!;
  return (
    <div className="px-4 pt-3 pb-6 @2xl:px-6">
      <button type="button" onClick={props.onBack} className="cursor-pointer text-sm text-cl-link hover:underline">
        ← All deals
      </button>
      <div className="mt-3 grid gap-5 @3xl:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="relative">
            <Picture deal={deal} className="h-48 rounded-xl @3xl:h-64" />
            <span className="absolute top-3 left-3">
              <Discount brand={brand} deal={deal} />
            </span>
          </div>
          <p className="mt-2 flex justify-between text-xs text-cl-muted tabular-nums">
            <span>Ends in {props.ends}</span>
            <span>Bought {count(props.bought)} times</span>
          </p>
        </div>
        <div>
          <h3 className="text-xl font-bold" style={{ color: SKIN[brand].ink }}>
            {deal.title}
          </h3>
          <p className="mt-1 text-sm text-cl-muted">
            {deal.venue}, {deal.address}
          </p>
          <fieldset className="mt-4 flex flex-col gap-2">
            {deal.options.map((option) => (
              <label key={option.id} className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm" style={{ borderColor: option.id === chosen.id ? SKIN[brand].ink : '#e3e3e3' }}>
                <input type="radio" name={`option-${deal.id}`} checked={option.id === chosen.id} onChange={() => props.onOption(option.id)} style={{ accentColor: SKIN[brand].ink }} />
                <span className="flex-1">{option.label}</span>
                <span className="text-right">
                  <b>{money(option.price, market)}</b>
                  <s className="ml-1.5 text-xs text-cl-muted">{money(option.old, market)}</s>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="mt-4 flex items-center gap-3 text-sm">
            <span>Coupons</span>
            <span className="flex items-center rounded-md border border-[#e3e3e3]">
              <button type="button" aria-label="One less" disabled={quantity <= 1} onClick={() => props.onQuantity(quantity - 1)} className="cursor-pointer px-3 py-1 disabled:cursor-default disabled:opacity-40">
                −
              </button>
              <span className="w-6 text-center tabular-nums">{quantity}</span>
              <button type="button" aria-label="One more" disabled={quantity >= 10} onClick={() => props.onQuantity(quantity + 1)} className="cursor-pointer px-3 py-1 disabled:cursor-default disabled:opacity-40">
                +
              </button>
            </span>
          </div>
          <p className="mt-4 text-sm">
            Total <b className="ml-1 text-xl">{money(chosen.price * quantity, market)}</b>
            <span className="ml-2 text-[#1e8e3e]">you save {money((chosen.old - chosen.price) * quantity, market)}</span>
          </p>
          <div className="mt-4">
            <Button brand={brand} onClick={props.onBuy} wide>
              Buy
            </Button>
          </div>
          <ul className="mt-5 flex flex-col gap-1.5 text-sm text-cl-ink">
            {deal.terms.map((term) => (
              <li key={term} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full" style={{ background: SKIN[brand].ink }} />
                {term}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, error, onChange, inputMode }: { label: string; value: string; error?: string; onChange: (value: string) => void; inputMode?: 'email' | 'tel' | 'numeric' }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-cl-muted">{label}</span>
      <input
        value={value}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        className="rounded-md border border-[#ddd] px-3 py-2 text-cl-ink outline-none focus:border-cl-navy aria-invalid:border-cl-red"
      />
      {error && <span className="text-xs text-cl-red">{error}</span>}
    </label>
  );
}

/** Groups of four digits for a card, as the field formats it while you type. */
const cardFormat = (value: string) => digits(value).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');

function Checkout(props: {
  brand: Brand;
  market: Market;
  deal: Deal;
  option: string;
  quantity: number;
  form: { email: string; phone: string; card: string };
  errors: Record<string, string>;
  paying: boolean;
  onField: (key: 'email' | 'phone' | 'card', value: string) => void;
  onPay: () => void;
  onBack: () => void;
}) {
  const { brand, market, deal, quantity, form, errors } = props;
  const chosen = deal.options.find((option) => option.id === props.option)!;
  return (
    <div className="px-4 pt-3 pb-6 @2xl:px-6">
      <button type="button" onClick={props.onBack} className="cursor-pointer text-sm text-cl-link hover:underline">
        ← Back to the deal
      </button>
      <h3 className="mt-3 text-xl font-bold" style={{ color: SKIN[brand].ink }}>
        Checkout
      </h3>
      <div className="mt-4 grid gap-5 @3xl:grid-cols-[1fr_1.2fr]">
        <div className="flex h-fit gap-3 rounded-xl bg-cl-grey p-3">
          <Picture deal={deal} className="size-16 shrink-0 rounded-lg" />
          <div className="min-w-0 text-sm">
            <p className="font-medium">{deal.title}</p>
            <p className="text-cl-muted">
              {chosen.label} × {quantity}
            </p>
            <p className="mt-1 text-lg font-bold">{money(chosen.price * quantity, market)}</p>
          </div>
        </div>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            props.onPay();
          }}
        >
          <Field label="Email for the coupon" value={form.email} error={errors.email} inputMode="email" onChange={(value) => props.onField('email', value)} />
          <Field label="Phone" value={form.phone} error={errors.phone} inputMode="tel" onChange={(value) => props.onField('phone', value)} />
          <Field label="Card" value={form.card} error={errors.card} inputMode="numeric" onChange={(value) => props.onField('card', cardFormat(value))} />
          <Button brand={brand} onClick={props.onPay} disabled={props.paying} wide>
            {props.paying ? 'Paying…' : `Pay ${money(chosen.price * quantity, market)}`}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Paid({ brand, order, onMail, onFeed }: { brand: Brand; order: Order; onMail: () => void; onFeed: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-full text-2xl" style={{ background: SKIN[brand].accent, color: SKIN[brand].onAccent }}>
        ✓
      </span>
      <h3 className="mt-4 text-xl font-bold" style={{ color: SKIN[brand].ink }}>
        Payment accepted
      </h3>
      <p className="mt-1 text-sm text-cl-muted">
        {order.quantity === 1 ? 'Your coupon is' : `Your ${order.quantity} coupons are`} on the way to {order.email}.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button brand={brand} onClick={onMail}>
          Open the email
        </Button>
        <button type="button" onClick={onFeed} className="cursor-pointer rounded-md border border-[#ddd] px-5 py-2.5 text-sm">
          More deals
        </button>
      </div>
    </div>
  );
}

/** A QR-like pattern, fixed for a code: three finder squares and cells from a hash of the code. */
function Qr({ code }: { code: string }) {
  const size = 21;
  let seed = [...code].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
  const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const finder = (x: number, y: number) => [[0, 0], [14, 0], [0, 14]].some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
  const cells: [number, number][] = [];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!finder(x, y) && random() > 0.52) cells.push([x, y]);
  return (
    <svg viewBox={`-1 -1 ${size + 2} ${size + 2}`} className="size-28 bg-white" aria-label={`QR code for ${code}`}>
      {[[0, 0], [14, 0], [0, 14]].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="7" height="7" fill="#111" />
          <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
          <rect x={x + 2} y={y + 2} width="3" height="3" fill="#111" />
        </g>
      ))}
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#111" />
      ))}
    </svg>
  );
}

/** The coupon email, as the templates were built: one centered column that also reads on a phone. */
function Letter({ order }: { order: Order }) {
  const skin = SKIN[order.brand];
  const deal = dealOf(order.deal);
  const option = optionOf(order);
  return (
    <div className={`bg-[#f4f4f4] px-3 py-5 ${skin.font}`}>
      <div className="mx-auto max-w-[34rem] overflow-hidden rounded-lg bg-white text-sm text-cl-ink">
        <div className="flex items-center px-5 py-4" style={{ background: skin.bar }}>
          {order.brand === 'chocolife' ? <img src="/icons/chocolife-logo.svg" alt="Chocolife.me" className="h-5 w-auto" /> : <Logo brand="besmart" />}
        </div>
        <div className="px-5 py-5">
          <p className="text-lg font-bold" style={{ color: skin.ink }}>
            Thank you for your purchase!
          </p>
          <p className="mt-1 text-cl-muted">Here is your coupon. Show the code or the QR code at the venue.</p>
          <div className="relative mt-4 rounded-lg border-2 border-dashed border-[#d6d6d6] p-4">
            <div className="flex flex-col items-center gap-4 @md:flex-row @md:items-start">
              <Qr code={order.code} />
              <div className="min-w-0 flex-1 text-center @md:text-left">
                <p className="text-xs tracking-wide text-cl-muted uppercase">Coupon code</p>
                <p className="font-mono text-2xl font-bold tracking-wider">{order.code}</p>
                <p className="mt-2 font-medium">{deal.title}</p>
                <p className="text-cl-muted">
                  {option.label}
                  {order.quantity > 1 ? ` × ${order.quantity}` : ''}
                </p>
                <p className="mt-2 text-xs text-cl-muted">
                  {deal.venue}, {deal.address}
                </p>
              </div>
            </div>
            {order.redeemed && (
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-md border-[3px] border-cl-red px-3 py-1 text-center font-mono text-lg font-bold text-cl-red opacity-85">
                REDEEMED
                <span className="block text-xs">today at {order.redeemed}</span>
              </span>
            )}
          </div>
          <ul className="mt-4 flex flex-col gap-1 text-xs text-cl-muted">
            {deal.terms.map((term) => (
              <li key={term}>· {term}</li>
            ))}
          </ul>
        </div>
        <div className="border-t border-[#eee] px-5 py-3 text-[0.7rem] text-cl-muted">
          {domain(order.brand, order.market)} · Questions about the coupon? Reply to this email. · Unsubscribe
        </div>
      </div>
    </div>
  );
}

function Mail({ orders, selected, onSelect }: { orders: Order[]; selected: number | null; onSelect: (id: number) => void }) {
  const open = orders.find((order) => order.id === selected);
  const list = [...orders].reverse();
  return (
    <div className="flex min-h-full font-roboto @3xl:flex-row">
      <ul className={`shrink-0 border-r border-[#eee] @3xl:w-64 ${open ? 'hidden @3xl:block' : 'w-full'}`}>
        <li className="px-4 py-3 text-sm font-medium text-[#3c4043]">Inbox</li>
        {list.length === 0 && <li className="px-4 py-3 text-sm text-cl-muted">No emails yet.</li>}
        {list.map((order) => (
          <li key={order.id}>
            <button type="button" onClick={() => onSelect(order.id)} className={`w-full cursor-pointer border-t border-[#eee] px-4 py-2.5 text-left text-sm ${order.id === selected ? 'bg-[#e8f0fe]' : 'hover:bg-[#f5f5f5]'}`}>
              <span className="flex justify-between">
                <span className={order.read ? '' : 'font-bold'}>{SKIN[order.brand].name}</span>
                <span className="text-xs text-cl-muted">{order.at}</span>
              </span>
              <span className={`block truncate ${order.read ? 'text-cl-muted' : 'font-medium'}`}>Your coupon: {dealOf(order.deal).title}</span>
            </button>
          </li>
        ))}
      </ul>
      {open && (
        <div className="min-w-0 flex-1">
          <div className="border-b border-[#eee] px-4 py-3 text-sm">
            <p className="font-medium">Your coupon: {dealOf(open.deal).title}</p>
            <p className="text-xs text-cl-muted">
              {SKIN[open.brand].name} &lt;coupons@{domain(open.brand, open.market)}&gt; to {open.email}
            </p>
          </div>
          <Letter order={open} />
        </div>
      )}
    </div>
  );
}

function Partner({ brand, deal, orders, redeemedBefore, onRedeem }: { brand: Brand; deal: Deal; orders: Order[]; redeemedBefore: Record<string, string>; onRedeem: (code: string) => void }) {
  const [query, setQuery] = useState('');
  const own = orders
    .filter((order) => order.deal === deal.id && order.brand === brand)
    .reverse()
    .map((order) => ({ code: order.code, option: optionOf(order).label, at: order.at, redeemed: order.redeemed, own: true }));
  const rows = [...own, ...soldBefore(deal, brand).map((row) => ({ ...row, redeemed: row.redeemed ?? redeemedBefore[row.code] ?? null, own: false }))].filter((row) =>
    row.code.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const all = [...own, ...soldBefore(deal, brand)];
  const used = all.filter((row) => row.redeemed || redeemedBefore[row.code]).length;
  return (
    <div className={`min-h-full bg-cl-grey ${SKIN[brand].font}`}>
      <header className="flex items-center gap-3 px-4 py-3 text-white @2xl:px-6" style={{ background: SKIN[brand].partnerBar }}>
        <span className="font-bold">Partner cabinet</span>
        <span className="text-sm text-white/70">
          {deal.venue} · {SKIN[brand].name}
        </span>
      </header>
      <div className="px-4 py-4 @2xl:px-6">
        <h3 className="text-lg font-bold text-cl-ink">Coupons for “{deal.title}”</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 @2xl:grid-cols-3">
          {[
            ['Sold today', all.length],
            ['Redeemed', used],
            ['Still valid', all.length - used],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-white p-3">
              <p className="text-xs text-cl-muted">{label}</p>
              <p className="text-xl font-bold text-cl-ink tabular-nums">{value}</p>
            </div>
          ))}
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Coupon code, e.g. CL-4827"
          aria-label="Find a coupon by code"
          className="mt-4 w-full rounded-md border border-[#ddd] bg-white px-3 py-2 text-sm outline-none focus:border-cl-navy"
        />
        <ul className="mt-3 flex flex-col gap-2">
          {rows.map((row) => (
            <li key={row.code} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-white px-3 py-2.5 text-sm" style={row.own ? { boxShadow: `inset 3px 0 0 ${SKIN[brand].badge}` } : undefined}>
              <span className="font-mono font-bold">{row.code}</span>
              {row.own && (
                <span className="rounded px-1.5 text-[0.7rem] font-bold text-white" style={{ background: SKIN[brand].badge }}>
                  NEW
                </span>
              )}
              <span className="text-cl-muted">{row.option}</span>
              <span className="text-cl-muted">bought {row.at}</span>
              <span className="ml-auto">
                {row.redeemed ? (
                  <span className="text-[#1e8e3e]">Redeemed at {row.redeemed}</span>
                ) : (
                  <button type="button" onClick={() => onRedeem(row.code)} className="cursor-pointer rounded-md px-3 py-1 font-medium" style={{ background: SKIN[brand].accent, color: SKIN[brand].onAccent }}>
                    Redeem
                  </button>
                )}
              </span>
            </li>
          ))}
          {rows.length === 0 && <li className="rounded-lg bg-white px-3 py-3 text-sm text-cl-muted">No coupon with this code for this deal.</li>}
        </ul>
      </div>
    </div>
  );
}
