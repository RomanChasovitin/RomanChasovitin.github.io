import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CATEGORIES, deals, MARKETS, money, soldBefore, type Brand, type Category, type Deal, type Market } from './deals';

// The life of a coupon, in one browser window. Pick a deal in the feed, choose an option, pay, get the
// coupon by email, and redeem it in the partner cabinet at the venue. Chocolife and BeSmart are two tabs of
// the same window: the same loop in two brands, and BeSmart in two countries. The device button in the
// address bar shows every page at phone width, email included.

type Tab = Brand | 'mail' | 'partner';
type Page = { name: 'feed' } | { name: 'deal'; deal: string } | { name: 'checkout'; deal: string } | { name: 'paid'; order: number };
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

const SKIN: Record<Brand, { name: string; accent: string; onAccent: string; ink: string; badge: string; font: string; partnerBar: string }> = {
  chocolife: { name: 'Chocolife', accent: '#f7da3b', onAccent: '#212121', ink: '#2e3a82', badge: '#e31e24', font: 'font-roboto', partnerBar: '#2e3a82' },
  besmart: { name: 'BeSmart', accent: '#2f9e6e', onAccent: '#ffffff', ink: '#1f6f4d', badge: '#ff7f00', font: 'font-lato', partnerBar: '#1f6f4d' },
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
  const [tab, setTab] = useState<Tab>('chocolife');
  const [store, setStore] = useState<Brand>('chocolife');
  const [market, setMarket] = useState<Market>('kz');
  const [pages, setPages] = useState<Record<Brand, Page>>({ chocolife: { name: 'feed' }, besmart: { name: 'feed' } });
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

  const page = pages[store];
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [tab, page]);

  const skin = SKIN[store];
  const storeMarket: Market = store === 'chocolife' ? 'kz' : market;
  const unread = orders.filter((order) => !order.read).length;
  const latest = orders.at(-1);

  const stage: Stage =
    tab === 'mail' ? 'coupon' : tab === 'partner' ? 'redeem' : page.name === 'feed' ? 'feed' : page.name === 'deal' ? 'deal' : 'checkout';

  const go = (next: Page) => setPages((all) => ({ ...all, [store]: next }));
  const openStore = (brand: Brand) => {
    setStore(brand);
    setTab(brand);
  };
  const openDeal = (id: string) => {
    setQuantity(1);
    go({ name: 'deal', deal: id });
  };

  function place(dealId: string, brand = store) {
    const deal = dealOf(dealId);
    const id = nextOrder++;
    const prefix = brand === 'chocolife' ? 'CL' : 'BS';
    const order: Order = {
      id,
      brand,
      market: brand === 'chocolife' ? 'kz' : market,
      deal: dealId,
      option: option[dealId] ?? deal.options[0].id,
      quantity,
      code: `${prefix}-${4827 + id * 13}-${String((1953 + id * 377) % 10000).padStart(4, '0')}`,
      email: form.email,
      at: clock(),
      redeemed: null,
      read: false,
    };
    setOrders((all) => [...all, order]);
    setBought((all) => ({ ...all, [dealId]: all[dealId] + quantity }));
    return order;
  }

  function pay(dealId: string) {
    const found: Record<string, string> = {};
    if (!EMAIL.test(form.email)) found.email = 'Enter an email: the coupon goes there.';
    if (digits(form.phone).length !== 11) found.phone = 'A phone number has 11 digits, with the country code.';
    if (digits(form.card).length !== 16) found.card = 'A card number has 16 digits.';
    setErrors(found);
    if (Object.keys(found).length) return;
    setPaying(true);
    setTimeout(() => {
      const order = place(dealId);
      setPaying(false);
      go({ name: 'paid', order: order.id });
    }, 1200);
  }

  function openMail(id?: number) {
    const target = id ?? orders.at(-1)?.id ?? null;
    setMail(target);
    if (target !== null) setOrders((all) => all.map((order) => (order.id === target ? { ...order, read: true } : order)));
    setTab('mail');
  }

  function jump(to: Stage) {
    const current = page.name === 'feed' ? deals[0].id : page.name === 'paid' ? orders.find((order) => order.id === page.order)!.deal : page.deal;
    if (to === 'feed' || to === 'deal' || to === 'checkout') {
      setTab(store);
      go(to === 'feed' ? { name: 'feed' } : { name: to, deal: current });
      return;
    }
    // The coupon and the venue need a purchase; without one, this buys the deal on screen.
    const order = latest ?? place(current);
    if (to === 'coupon') openMail(order.id);
    else setTab('partner');
  }

  function redeem(code: string) {
    const at = clock();
    const own = orders.find((order) => order.code === code);
    if (own) setOrders((all) => all.map((order) => (order.code === code ? { ...order, redeemed: at } : order)));
    else setRedeemedBefore((all) => ({ ...all, [code]: at }));
  }

  const partnerBrand = latest?.brand ?? store;
  const url =
    tab === 'mail'
      ? 'mail.example.com/inbox'
      : tab === 'partner'
        ? `partner.${domain(partnerBrand, latest?.market ?? storeMarket)}/coupons`
        : `${domain(store, storeMarket)}${page.name === 'feed' ? `/${MARKETS[storeMarket].cities[0].toLowerCase()}` : page.name === 'deal' ? `/deal/${page.deal}` : page.name === 'checkout' ? '/checkout' : '/checkout/done'}`;

  return (
    <div className="flex h-full flex-col gap-3">
      <ol className="flex shrink-0 items-center gap-1.5 text-sm">
        {STAGES.map((item, index) => (
          <li key={item.id} className="flex items-center gap-1.5">
            <button
              type="button"
              aria-current={stage === item.id ? 'step' : undefined}
              onClick={() => jump(item.id)}
              className="flex cursor-pointer items-center gap-2 rounded-full bg-white px-3.5 py-1.5 font-medium text-cl-ink shadow-sm transition-colors hover:bg-[#fff6c2] aria-[current=step]:bg-cl-navy aria-[current=step]:text-white"
            >
              <span className="text-xs opacity-60">{index + 1}</span>
              {item.label}
            </button>
            {index < STAGES.length - 1 && <span className="text-cl-muted">→</span>}
          </li>
        ))}
      </ol>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-white shadow-[0_30px_70px_-35px_rgb(46_58_130/0.45)]">
        {/* Tabs */}
        <div className="flex shrink-0 items-end gap-1 bg-[#dfe1e5] px-3 pt-2 text-[0.8rem]">
          <span className="mr-2 mb-2.5 flex gap-1.5" aria-hidden="true">
            <i className="size-3 rounded-full bg-[#ff5f57]" />
            <i className="size-3 rounded-full bg-[#febc2e]" />
            <i className="size-3 rounded-full bg-[#28c840]" />
          </span>
          {(
            [
              ['chocolife', <img src="/icons/chocolife.png" alt="" className="size-4 rounded" />, 'Chocolife.me'],
              ['besmart', <img src="/icons/besmart.svg" alt="" className="size-4 rounded" />, `BeSmart.${MARKETS[market].domain}`],
              ['mail', <MailIcon />, 'Mail'],
              ['partner', <span className="size-4 rounded" style={{ background: SKIN[partnerBrand].partnerBar }} />, 'Partner cabinet'],
            ] as [Tab, ReactNode, string][]
          ).map(([id, icon, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={tab === id}
              onClick={() => (id === 'mail' ? openMail(mail ?? undefined) : id === 'partner' ? setTab('partner') : openStore(id))}
              className="flex max-w-48 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-t-lg px-3 py-2 text-[#3c4043] hover:bg-white/50 aria-pressed:bg-white"
            >
              {icon}
              <span className="truncate">{label}</span>
              {id === 'mail' && unread > 0 && <span className="ml-auto rounded-full bg-[#d93025] px-1.5 text-[0.65rem] font-bold text-white">{unread}</span>}
            </button>
          ))}
        </div>

        {/* Address bar */}
        <div className="flex shrink-0 items-center gap-2 border-b border-[#e1e1e1] px-3 py-1.5">
          <span className="flex-1 truncate rounded-full bg-[#f1f3f4] px-4 py-1 text-[0.8rem] text-[#5f6368]">
            <span className="text-[#1e8e3e]">🔒</span> {url}
          </span>
          <button
            type="button"
            aria-pressed={mobile}
            aria-label={mobile ? 'Show at desktop width' : 'Show at phone width'}
            onClick={() => setMobile((value) => !value)}
            className="flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.75rem] text-[#5f6368] hover:bg-[#f1f3f4] aria-pressed:bg-cl-navy aria-pressed:text-white"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              {mobile ? <rect x="3" y="5" width="18" height="12" rx="1.5" /> : <rect x="7" y="2.5" width="10" height="19" rx="2" />}
              {mobile ? <path d="M1 20h22" /> : <path d="M11 18.5h2" />}
            </svg>
            {mobile ? 'Desktop' : 'Phone'}
          </button>
        </div>

        {/* Page */}
        <div ref={scroller} className={`min-h-0 flex-1 overflow-y-auto ${mobile ? 'bg-[#e9e9ec] py-4' : ''}`}>
          <div className={`@container min-h-full ${mobile ? 'mx-auto w-[390px] overflow-hidden rounded-[1.6rem] border-[6px] border-[#1f1f1f] bg-white' : ''}`}>
            {tab === 'mail' ? (
              <Mail orders={orders} selected={mail} onSelect={openMail} />
            ) : tab === 'partner' ? (
              <Partner brand={partnerBrand} deal={dealOf(latest?.deal ?? deals[0].id)} orders={orders} redeemedBefore={redeemedBefore} onRedeem={redeem} />
            ) : (
              <div className={`${skin.font} text-cl-ink`}>
                <StoreHeader brand={store} market={storeMarket} onMarket={setMarket} onHome={() => go({ name: 'feed' })} orders={orders.filter((order) => order.brand === store).length} />
                {page.name === 'feed' && (
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
                {page.name === 'deal' && (
                  <DealPage
                    brand={store}
                    market={storeMarket}
                    deal={dealOf(page.deal)}
                    option={option[page.deal] ?? dealOf(page.deal).options[0].id}
                    onOption={(id) => setOption((all) => ({ ...all, [page.deal]: id }))}
                    quantity={quantity}
                    onQuantity={setQuantity}
                    bought={bought[page.deal]}
                    ends={left(opened.current + dealOf(page.deal).endsIn * 3600_000 - now)}
                    onBack={() => go({ name: 'feed' })}
                    onBuy={() => go({ name: 'checkout', deal: page.deal })}
                  />
                )}
                {page.name === 'checkout' && (
                  <Checkout
                    brand={store}
                    market={storeMarket}
                    deal={dealOf(page.deal)}
                    option={option[page.deal] ?? dealOf(page.deal).options[0].id}
                    quantity={quantity}
                    form={form}
                    errors={errors}
                    paying={paying}
                    onField={(key, value) => setForm((all) => ({ ...all, [key]: value }))}
                    onPay={() => pay(page.deal)}
                    onBack={() => go({ name: 'deal', deal: page.deal })}
                  />
                )}
                {page.name === 'paid' && <Paid brand={store} order={orders.find((order) => order.id === page.order)!} onMail={() => openMail(page.order)} onFeed={() => go({ name: 'feed' })} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
      <rect x="2" y="4.5" width="20" height="15" rx="2.5" fill="#ea4335" />
      <path d="m5 8 7 5.5L19 8" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
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
  const green = brand === 'besmart';
  return (
    <header className={`flex items-center gap-3 px-4 py-3 @2xl:px-6 ${green ? 'text-white' : 'border-b border-[#eee]'}`} style={green ? { background: SKIN.besmart.accent } : undefined}>
      <button type="button" onClick={onHome} className="cursor-pointer" aria-label="All deals">
        <Logo brand={brand} />
      </button>
      <select
        aria-label="City"
        className={`rounded border px-2 py-1 text-sm ${green ? 'border-white/40 bg-transparent text-white' : 'border-[#ddd] bg-white text-cl-ink'}`}
        defaultValue={MARKETS[market].cities[0]}
        key={market}
      >
        {MARKETS[market].cities.map((city) => (
          <option key={city} className="text-cl-ink">
            {city}
          </option>
        ))}
      </select>
      {green && (
        <span className="hidden rounded border border-white/40 text-xs @xl:flex">
          {(['kz', 'kg'] as Market[]).map((value) => (
            <button key={value} type="button" aria-pressed={market === value} onClick={() => onMarket(value)} className="cursor-pointer px-2 py-1 aria-pressed:bg-white aria-pressed:text-[#1f6f4d]">
              besmart.{value}
            </button>
          ))}
        </span>
      )}
      <span className={`ml-auto hidden flex-1 items-center rounded-md px-3 py-1.5 text-sm @3xl:flex ${green ? 'bg-white/15 text-white/80' : 'bg-cl-grey text-cl-muted'}`}>Search deals</span>
      <span className="ml-auto text-sm @3xl:ml-0">
        My coupons <b className="ml-1 rounded px-1.5 py-0.5 text-xs" style={{ background: green ? '#fff' : SKIN.chocolife.accent, color: green ? SKIN.besmart.ink : '#212121' }}>{orders}</b>
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
        <div className="flex items-center px-5 py-4" style={{ background: skin.accent }}>
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
