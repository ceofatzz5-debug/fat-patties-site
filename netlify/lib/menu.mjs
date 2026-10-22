// Server-side menu and delivery rules for Fat Patties Eats.
// Prices here are the source of truth: the checkout never trusts prices sent by the browser.
// Keep in sync with the menu in eats/index.html.

export const SIZE_NAMES = ['Single', 'Double', 'Triple'];

export const ADDONS = { 'Bacon': 3, 'Fried egg': 2 };

export const RESTAURANTS = {
  jumbo: 'Jumbo Jive Turkey Legs',
  smash: 'A Proper Smash',
};

export const MENU = {
  jumbo: {
    gobfather: { name: 'The Gobfather', price: 25 },
    gobmother: { name: 'The Gobmother', price: 25 },
    gobster: { name: 'Straight Gobster Mac', price: 25 },
    dressed: { name: 'Dressed Up & Dripped Out', price: 25 },
    jmac: { name: 'Jivester Mac', price: 15 },
    jumbojiv: { name: 'Jumbo Jivester', price: 15 },
    smothered: { name: 'Smothered Jivester', price: 15 },
    seafood: { name: 'Seafood Mac Bowl', price: 15 },
    original: { name: 'Original Jivester', price: 13 },
    blackbean: { name: 'Black Bean Cajun Rice Bowl', price: 10 },
    biscuit: { name: 'Biscuit & GDC Gravy', price: 10 },
    cajunrice: { name: 'Cajun Rice', price: 5 },
    slaw: { name: 'Coleslaw', price: 5 },
    dressing: { name: 'Dressing', price: 5 },
    mac: { name: 'Mac & Cheese', price: 5 },
  },
  smash: {
    proper: { name: 'Proper Smash Burger', sizes: [8, 12, 15], addons: true },
    american: { name: 'American Smash Burger', sizes: [10, 13, 16], addons: true },
    bbq: { name: 'BBQ Smash Burger', sizes: [11, 14, 17], addons: true },
    mush: { name: 'Mush/Swiss/Gravy Smash', sizes: [12, 15, 18], addons: true },
    proppa: { name: 'The Big Proppa', price: 19, addons: true },
    fries: { name: 'Proper Fries Regular', price: 4 },
    cfries: { name: 'Proper Fries Cheese', price: 5 },
    gfries: { name: 'Proper Fries Cheese Gravy', price: 6.5 },
    lfries: { name: 'Proper Fries Loaded', price: 10 },
    sauce: { name: 'Proper Sauce Cup', price: 1 },
    punch: { name: 'Proper Punch', price: 5 },
  },
};

// Zones measured from The Ritz Lounge, 2628 N. Harding St.
export const ZONES = [
  { id: 1, label: 'Zone 1 (0–3 mi)', fee: 7.99, driver: 6, min: 15 },
  { id: 2, label: 'Zone 2 (3–6 mi)', fee: 9.99, driver: 8, min: 15 },
  { id: 3, label: 'Zone 3 (6–10 mi)', fee: 13.99, driver: 11, min: 15 },
  { id: 4, label: 'Zone 4 (10–15 mi)', fee: 18.99, driver: 15, min: 25 },
];

export const TIPS = [0, 3, 5, 8];

// Fat Patties cut of restaurant food sales (10% = delivery-only plan).
export const FP_CUT = 0.10;

export const STATUSES = ['received', 'cooking', 'picked_up', 'delivered', 'canceled'];

export const cents = (dollars) => Math.round(dollars * 100);
