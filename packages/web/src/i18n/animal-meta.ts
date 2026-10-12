/**
 * Fan-pack animal names + short original blurbs (not from publisher PDF).
 * Images: /animals/{slug}.png
 */
export type AnimalMeta = {
  slug: string;
  name: { en: string; ru: string };
  blurb: { en: string; ru: string };
};

const META: AnimalMeta[] = [
  {
    slug: "hedgehog",
    name: { en: "Hedgehog", ru: "Ёж" },
    blurb: {
      en: "A prickly forager that noses through leaf litter for worms and soft berries.",
      ru: "Колючий обитатель подстилки — ищет червяков и мягкие ягоды среди листвы.",
    },
  },
  {
    slug: "badger",
    name: { en: "Badger", ru: "Барсук" },
    blurb: {
      en: "A sturdy digger that stores whatever the night paths offer before winter.",
      ru: "Крепкий землекоп — запасает всё, что найдёт на ночных тропах до зимы.",
    },
  },
  {
    slug: "beaver",
    name: { en: "European beaver", ru: "Европейский бобр" },
    blurb: {
      en: "Builds quiet waterways and gathers sturdy bites along the stream edges.",
      ru: "Устраивает тихие заводи и собирает крепкие запасы у самой воды.",
    },
  },
  {
    slug: "fox",
    name: { en: "Red fox", ru: "Обыкновенная лисица" },
    blurb: {
      en: "A clever prowler — eggs and worms along a clear path suit it best.",
      ru: "Хитрая охотница: лучше всего ей подходят яйца и червяки на чистой тропе.",
    },
  },
  {
    slug: "blue-jay",
    name: { en: "Blue jay", ru: "Голубая сойка" },
    blurb: {
      en: "A bright caller that caches nuts and chatters over the canopy.",
      ru: "Яркая крикунья — прячет орехи и перекликается над кронами.",
    },
  },
  {
    slug: "magpie",
    name: { en: "Magpie", ru: "Сорока" },
    blurb: {
      en: "Curious and quick — collects shiny scraps of food along twisting trails.",
      ru: "Любопытная и быстрая — подбирает лакомые находки на извилистых тропах.",
    },
  },
  {
    slug: "mole",
    name: { en: "Mole", ru: "Крот" },
    blurb: {
      en: "Lives under the soil, pulling worms into a deep, dark pantry.",
      ru: "Живёт под землёй и тащит червяков в тёмную подземную кладовую.",
    },
  },
  {
    slug: "raven",
    name: { en: "Raven", ru: "Ворон" },
    blurb: {
      en: "A watchful black shape in the trees, patient for rich forest finds.",
      ru: "Чёрный страж крон — терпеливо ждёт богатых лесных находок.",
    },
  },
  {
    slug: "barn-owl",
    name: { en: "Barn owl", ru: "Обыкновенная сипуха" },
    blurb: {
      en: "Silent wings at dusk — listens for small meals along the path edges.",
      ru: "Бесшумные крылья в сумерках — слышит мелкую добычу у края тропы.",
    },
  },
  {
    slug: "mouse",
    name: { en: "Mouse", ru: "Мышь" },
    blurb: {
      en: "Tiny feet, big appetite for seeds and soft berries before frost.",
      ru: "Крошечные лапки и большой аппетит к семенам и мягким ягодам до морозов.",
    },
  },
  {
    slug: "shrew",
    name: { en: "Shrew", ru: "Землеройка" },
    blurb: {
      en: "Always hungry — races after worms to keep warm through autumn nights.",
      ru: "Всегда голодна — гоняется за червяками, чтобы согреться осенними ночами.",
    },
  },
  {
    slug: "squirrel",
    name: { en: "Squirrel", ru: "Белка" },
    blurb: {
      en: "A leaping hoarder of nuts, darting branch to branch above the paths.",
      ru: "Прыгучая запасливая хозяйка орехов — с ветки на ветку над тропами.",
    },
  },
  {
    slug: "woodpecker",
    name: { en: "Woodpecker", ru: "Дятел" },
    blurb: {
      en: "Drums on bark and pulls insects where the trail meets old timber.",
      ru: "Барабанит по коре и достаёт насекомых там, где тропа касается старого дерева.",
    },
  },
  {
    slug: "chipmunk",
    name: { en: "Chipmunk", ru: "Бурундук" },
    blurb: {
      en: "Cheek pouches full of seeds — a striped dash between roots and stones.",
      ru: "Защёчные мешочки полны семян — полосатый бегун между корнями и камнями.",
    },
  },
  {
    slug: "titmouse",
    name: { en: "Great tit", ru: "Большая синица" },
    blurb: {
      en: "A lively songbird that picks eggs and worms from open path bends.",
      ru: "Живая певчая птица — собирает яйца и червяков на открытых изгибах троп.",
    },
  },
  {
    slug: "wildcat",
    name: { en: "Wildcat", ru: "Дикий кот" },
    blurb: {
      en: "Soft-footed and wary — stalks the forest edges for a careful feast.",
      ru: "Мягколапый и осторожный — крадётся по опушкам к своему неспешному пиру.",
    },
  },
  {
    slug: "pygmy-possum",
    name: { en: "Pygmy possum", ru: "Карликовый поссум" },
    blurb: {
      en: "A tiny night climber that snuggles into warm pockets of food.",
      ru: "Крошечный ночной древолаз — устраивается в тёплых укромных запасах.",
    },
  },
  {
    slug: "chickadee",
    name: { en: "Chickadee", ru: "Карликовая гаичка" },
    blurb: {
      en: "A small winter voice among twigs, pecking what the path still holds.",
      ru: "Маленький зимний голосок в ветвях — клюёт то, что ещё лежит на тропе.",
    },
  },
  {
    slug: "hamster",
    name: { en: "Hamster", ru: "Хомяк" },
    blurb: {
      en: "Stuffs a burrow pantry with grains and berries for the long cold.",
      ru: "Набивает нору зерном и ягодами — кладовая к долгому холоду.",
    },
  },
  // Advisors (art available; not in playable deck)
  {
    slug: "rooster",
    name: { en: "Rooster", ru: "Петух" },
    blurb: {
      en: "Wakes the table early — the first to choose when dawn hits the forest.",
      ru: "Будит стол пораньше — первым выбирает, когда рассвет касается леса.",
    },
  },
  {
    slug: "armadillo",
    name: { en: "Armadillo", ru: "Броненосец" },
    blurb: {
      en: "Teaches deeper dens — one more space in an animal’s store.",
      ru: "Учит рыть глубже — ещё одно место в запасах животного.",
    },
  },
  {
    slug: "goat",
    name: { en: "Goat", ru: "Козлик" },
    blurb: {
      en: "Shares a drop of water that sweetens one kind of food.",
      ru: "Делится каплей воды, от которой один вид еды становится вкуснее.",
    },
  },
  {
    slug: "rabbit",
    name: { en: "Rabbit", ru: "Кролик" },
    blurb: {
      en: "Brings new neighbors into your forest from the animal paths.",
      ru: "Приводит новых соседей в ваш лес с троп животных.",
    },
  },
];

const bySlug = new Map(META.map((m) => [m.slug, m]));

export function animalMetaBySlug(slug: string | null | undefined): AnimalMeta | undefined {
  if (!slug) return undefined;
  return bySlug.get(slug);
}

export function animalImageSrc(slug: string): string {
  return `/animals/${slug}.png`;
}
