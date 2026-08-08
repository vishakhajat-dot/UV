const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const GROUPS = {
  ELECTRICAL: "Electrical Parts",
  WIRING: "Wiring Solutions",
  BULBS_SWITCHES: "Bulbs & Switches",
  COOLING: "Cooling Solutions",
  ESSENTIALS: "Additional Essentials",
};

const categories = [
  { name: "Tail Lamps", slug: "tail-lamps", group: GROUPS.ELECTRICAL },
  { name: "Side Indicators", slug: "side-indicators", group: GROUPS.ELECTRICAL },
  { name: "Headlight Bulb Holders", slug: "headlight-bulb-holders", group: GROUPS.ELECTRICAL },
  { name: "Mirror Switches", slug: "mirror-switches", group: GROUPS.ELECTRICAL },

  { name: "Canon Wires", slug: "canon-wires", group: GROUPS.WIRING },
  { name: "Battery Terminals", slug: "battery-terminals", group: GROUPS.WIRING },
  { name: "Battery Wires", slug: "battery-wires", group: GROUPS.WIRING },
  { name: "Battery Lugs", slug: "battery-lugs", group: GROUPS.WIRING },

  { name: "Radhe Bulbs", slug: "radhe-bulbs", group: GROUPS.BULBS_SWITCHES },
  { name: "Vasko Bulbs", slug: "vasko-bulbs", group: GROUPS.BULBS_SWITCHES },
  { name: "KSV Bulbs", slug: "ksv-bulbs", group: GROUPS.BULBS_SWITCHES },
  { name: "Sunny Switches", slug: "sunny-switches", group: GROUPS.BULBS_SWITCHES },

  { name: "Automotive Coolants", slug: "automotive-coolants", group: GROUPS.COOLING },
  { name: "AdBlue Solutions", slug: "adblue-solutions", group: GROUPS.COOLING },

  { name: "Wiring Clips", slug: "wiring-clips", group: GROUPS.ESSENTIALS },
  { name: "Wiper Blades", slug: "wiper-blades", group: GROUPS.ESSENTIALS },
  { name: "KKK Fans", slug: "kkk-fans", group: GROUPS.ESSENTIALS },
];

const products = [
  // Tail Lamps
  { name: "Tail Lamp Assembly - Truck/Tempo (Red-Amber-Clear)", slug: "tail-lamp-truck-tempo", brand: "Vasko", category: "tail-lamps", price: 320, unit: "piece", stock: 60, description: "Multi-segment tail lamp assembly for trucks and tempos, red/amber/clear lens.", featured: true, imageUrl: "/images/products/indiamart-4.jpg" },
  { name: "Tail Lamp Assembly - Commercial Vehicle", slug: "tail-lamp-commercial-vehicle", brand: "Assorted", category: "tail-lamps", price: 280, unit: "piece", stock: 55, description: "Replacement tail lamp assembly for light commercial vehicles.", imageUrl: "/images/products/indiamart-7.jpg" },
  { name: "Motorcycle Tail Lamp Assembly", slug: "motorcycle-tail-lamp", brand: "Assorted", category: "tail-lamps", price: 190, unit: "piece", stock: 100, description: "Replacement tail lamp assembly for popular motorcycle models." },

  // Side Indicators
  { name: "LED Side Marker / Indicator Lamp (Amber)", slug: "led-side-marker-amber", brand: "Assorted", category: "side-indicators", price: 65, unit: "piece", stock: 150, description: "Amber LED side marker and indicator lamp, weatherproof housing.", featured: true, imageUrl: "/images/products/indiamart-1.jpg" },
  { name: "Round Clearance / Marker Lamp (Red)", slug: "round-clearance-lamp-red", brand: "Assorted", category: "side-indicators", price: 55, unit: "piece", stock: 120, description: "Round red clearance/marker lamp for trucks and trailers.", imageUrl: "/images/products/indiamart-6-trucktoplight.png" },
  { name: "LED Indicator Assembly (Pair)", slug: "led-indicator-pair", brand: "Assorted", category: "side-indicators", price: 320, unit: "pair", stock: 80, description: "Bright LED turn-indicator assembly, amber, universal fit." },

  // Headlight Bulb Holders
  { name: "Headlight Bulb Holder / Adapter (Universal)", slug: "headlight-bulb-holder-universal", brand: "Assorted", category: "headlight-bulb-holders", price: 45, unit: "piece", stock: 140, description: "Universal headlight bulb holder and wiring adapter for H4/H3 bulbs.", imageUrl: "/images/products/indiamart-2.jpg" },
  { name: "Headlight Bulb Holder - Ceramic", slug: "headlight-bulb-holder-ceramic", brand: "Assorted", category: "headlight-bulb-holders", price: 60, unit: "piece", stock: 90, description: "Heat-resistant ceramic bulb holder for high-wattage headlight bulbs." },

  // Mirror Switches
  { name: "Truck Side Mirror - Wide Angle", slug: "truck-side-mirror-wide-angle", brand: "Assorted", category: "mirror-switches", price: 380, unit: "piece", stock: 40, description: "Wide-angle flat side mirror for trucks and commercial vehicles.", featured: true, imageUrl: "/images/products/indiamart-3.jpg" },
  { name: "Power Mirror Adjustment Switch (Universal)", slug: "power-mirror-switch", brand: "Sunny", category: "mirror-switches", price: 140, unit: "piece", stock: 70, description: "Universal power mirror adjustment switch for cars." },
  { name: "Side Mirror - Two Wheeler (Pair)", slug: "side-mirror-2w-pair", brand: "Assorted", category: "mirror-switches", price: 140, unit: "pair", stock: 120, description: "Universal fit side mirrors for motorcycles and scooters." },

  // Canon Wires
  { name: "Canon Wiring Harness - Two Wheeler (Universal)", slug: "canon-wiring-harness-2w", brand: "Canon", category: "canon-wires", price: 850, unit: "set", stock: 40, description: "Complete universal wiring harness set for two-wheelers. Color-coded, heat-resistant insulation." },
  { name: "Canon Electrical Wire Roll 1.5mm (90m)", slug: "canon-wire-roll-1-5mm", brand: "Canon", category: "canon-wires", price: 950, unit: "roll", stock: 60, description: "Automotive-grade copper electrical wire, 1.5mm, 90 meter roll." },
  { name: "Canon Connector & Terminal Kit", slug: "canon-connector-kit", brand: "Canon", category: "canon-wires", price: 180, unit: "kit", stock: 100, description: "Assorted electrical connectors and terminals for auto wiring repairs." },

  // Battery Terminals
  { name: "Battery Terminal Clamp Set (+/-)", slug: "battery-terminal-clamp-set", brand: "Assorted", category: "battery-terminals", price: 90, unit: "set", stock: 110, description: "Heavy-duty positive/negative battery terminal clamp set." },
  { name: "Battery Terminal Cover (Pair)", slug: "battery-terminal-cover", brand: "Assorted", category: "battery-terminals", price: 40, unit: "pair", stock: 150, description: "Insulated rubber battery terminal covers, red & black." },

  // Battery Wires
  { name: "Battery Cable Wire 6 AWG (per meter)", slug: "battery-cable-wire-6awg", brand: "Canon", category: "battery-wires", price: 120, unit: "meter", stock: 200, description: "Heavy-duty battery cable wire for automotive and commercial vehicle use." },
  { name: "Battery Jumper Wire Set", slug: "battery-jumper-wire-set", brand: "Assorted", category: "battery-wires", price: 250, unit: "set", stock: 65, description: "Ready-made battery jumper wire set with lugs fitted." },

  // Battery Lugs
  { name: "Battery Lug / Cable Terminal (Pack of 10)", slug: "battery-lug-pack-10", brand: "Assorted", category: "battery-lugs", price: 150, unit: "pack", stock: 90, description: "Copper battery cable lugs, pack of 10, assorted sizes." },

  // Radhe Bulbs
  { name: "Radhe Headlight Bulb H4 12V 60/55W", slug: "radhe-headlight-h4", brand: "Radhe", category: "radhe-bulbs", price: 65, unit: "piece", stock: 200, description: "Durable H4 headlight bulb for two-wheelers and commercial vehicles. Bright, long-lasting filament." },
  { name: "Radhe Indicator Bulb 12V 10W", slug: "radhe-indicator-bulb", brand: "Radhe", category: "radhe-bulbs", price: 12, unit: "piece", stock: 500, description: "Standard indicator/turn-signal bulb, amber glass, fits most motorcycles and cars." },
  { name: "Radhe LED Fog Lamp (Round)", slug: "radhe-led-fog-lamp-round", brand: "Radhe", category: "radhe-bulbs", price: 420, unit: "piece", stock: 45, description: "Round multi-LED fog lamp by Radhe for clear visibility in low light and fog.", featured: true, imageUrl: "/images/products/indiamart-8.jpg" },

  // Vasko Bulbs
  { name: "Vasko Headlight Bulb H4 12V 60/55W", slug: "vasko-headlight-h4", brand: "Vasko", category: "vasko-bulbs", price: 60, unit: "piece", stock: 180, description: "High-output H4 bulb from Vasko, trusted for consistent brightness and vibration resistance." },
  { name: "Vasko Brake Light Bulb 12V 21/5W", slug: "vasko-brake-light-bulb", brand: "Vasko", category: "vasko-bulbs", price: 15, unit: "piece", stock: 350, description: "Dual-filament brake/tail light bulb." },

  // KSV Bulbs
  { name: "KSV Fog Lamp Bulb H3 12V 55W", slug: "ksv-fog-lamp-h3", brand: "KSV", category: "ksv-bulbs", price: 45, unit: "piece", stock: 150, description: "H3 fog lamp bulb by KSV, built for clear visibility in low light and fog." },
  { name: "KSV Dome Light Bulb 12V 10W", slug: "ksv-dome-light-bulb", brand: "KSV", category: "ksv-bulbs", price: 10, unit: "piece", stock: 300, description: "Interior dome/cabin light bulb for cars and commercial vehicles." },

  // Sunny Switches
  { name: "Sunny Handlebar Switch Assembly (Universal)", slug: "sunny-handlebar-switch", brand: "Sunny", category: "sunny-switches", price: 220, unit: "piece", stock: 90, description: "Left/right handlebar switch assembly for horn, indicator and headlight control." },
  { name: "Sunny Ignition Switch (Universal)", slug: "sunny-ignition-switch", brand: "Sunny", category: "sunny-switches", price: 160, unit: "piece", stock: 70, description: "Reliable ignition switch/lock set for two-wheelers." },
  { name: "Sunny Horn Button Switch", slug: "sunny-horn-button", brand: "Sunny", category: "sunny-switches", price: 35, unit: "piece", stock: 200, description: "Replacement horn push-button switch." },

  // Automotive Coolants
  { name: "Radiator Coolant Concentrate - 1L", slug: "radiator-coolant-concentrate-1l", brand: "Assorted", category: "automotive-coolants", price: 220, unit: "bottle", stock: 80, description: "Concentrated ethylene-glycol based radiator coolant, dilute before use." },
  { name: "Radiator Coolant Ready-to-Use - 5L", slug: "radiator-coolant-ready-5l", brand: "Assorted", category: "automotive-coolants", price: 650, unit: "can", stock: 50, description: "Ready-to-use pre-mixed radiator coolant for cars and commercial vehicles." },

  // AdBlue Solutions
  { name: "KoolOn AdBlue / DEF - 20L Can", slug: "koolon-adblue-def-20l", brand: "KoolOn", category: "adblue-solutions", price: 700, unit: "can", stock: 60, description: "High-purity AUS 32 AdBlue / Diesel Exhaust Fluid for SCR-equipped diesel vehicles, 20 litre can. BS IV & BS VI compliant.", featured: true, imageUrl: "/images/products/indiamart-5.jpg" },
  { name: "AdBlue / DEF - 10L Can", slug: "adblue-def-10l", brand: "Assorted", category: "adblue-solutions", price: 380, unit: "can", stock: 90, description: "High-purity AUS 32 AdBlue / Diesel Exhaust Fluid, 10 litre can." },

  // Wiring Clips
  { name: "Wiring Clip Assortment Pack", slug: "wiring-clip-assortment-pack", brand: "Assorted", category: "wiring-clips", price: 80, unit: "pack", stock: 130, description: "Assorted automotive wiring clips and cable clamps for routing and securing wires." },

  // Wiper Blades
  { name: "Universal Wiper Blade (14-24 inch)", slug: "universal-wiper-blade", brand: "Assorted", category: "wiper-blades", price: 180, unit: "piece", stock: 100, description: "Universal fit wiper blade, available in multiple sizes from 14 to 24 inch." },

  // KKK Fans
  { name: "KKK Radiator Cooling Fan (Universal)", slug: "kkk-radiator-cooling-fan", brand: "KKK", category: "kkk-fans", price: 950, unit: "piece", stock: 30, description: "Universal radiator cooling fan assembly, KKK type, for cars and light commercial vehicles." },
];

async function main() {
  console.log("Seeding categories...");
  const categoryMap = {};
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, group: c.group },
      create: c,
    });
    categoryMap[c.slug] = cat.id;
  }

  console.log("Seeding products...");
  for (const p of products) {
    const { category, ...rest } = p;
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { ...rest, categoryId: categoryMap[category] },
      create: { ...rest, categoryId: categoryMap[category] },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
