/**
 * Fan-pack animal names + short original blurbs (not from publisher PDF).
 * Images: /animals/{slug}.png
 */
import type { Locale } from "./messages";

export type AnimalMeta = {
  slug: string;
  name: Record<Locale, string>;
  blurb: Record<Locale, string>;
};

const META: AnimalMeta[] = [
  {
    slug: "hedgehog",
    name: { en: "Hedgehog", ru: "Ёж", uk: "Їжак", be: "Вожык" },
    blurb: {
      en: "A prickly forager that noses through leaf litter for worms and soft berries.",
      ru: "Колючий обитатель подстилки — ищет червяков и мягкие ягоды среди листвы.",
      uk: "Колючий мешканець підстилки — шукає черв'яків і м'які ягоди серед листя.",
      be: "Калючы жыхар подсцілу — шукае чарвякоў і мяккія ягады сярод лісця.",
    },
  },
  {
    slug: "badger",
    name: { en: "Badger", ru: "Барсук", uk: "Борсук", be: "Барсук" },
    blurb: {
      en: "A sturdy digger that stores whatever the night paths offer before winter.",
      ru: "Крепкий землекоп — запасает всё, что найдёт на ночных тропах до зимы.",
      uk: "Міцний землекоп — запасає все, що знайде на нічних стежках до зими.",
      be: "Моцны землякоп — запасае ўсё, што знойдзе на начных сцежках да зімы.",
    },
  },
  {
    slug: "beaver",
    name: {
      en: "European beaver",
      ru: "Европейский бобр",
      uk: "Європейський бобер",
      be: "Еўрапейскі бабёр",
    },
    blurb: {
      en: "Builds quiet waterways and gathers sturdy bites along the stream edges.",
      ru: "Устраивает тихие заводи и собирает крепкие запасы у самой воды.",
      uk: "Влаштовує тихі заводі й збирає міцні запаси біля самої води.",
      be: "Ладуе ціхія затокі і збірае моцныя запасы ля самай вады.",
    },
  },
  {
    slug: "fox",
    name: {
      en: "Red fox",
      ru: "Обыкновенная лисица",
      uk: "Звичайна лисиця",
      be: "Звычайная лісіца",
    },
    blurb: {
      en: "A clever prowler — eggs and worms along a clear path suit it best.",
      ru: "Хитрая охотница: лучше всего ей подходят яйца и червяки на чистой тропе.",
      uk: "Хитра мисливиця: найкраще їй пасують яйця й черв'яки на чистій стежці.",
      be: "Хітрая паляўнічая: найлепш ёй пасуюць яйкі і чарвякі на чыстай сцежцы.",
    },
  },
  {
    slug: "blue-jay",
    name: { en: "Blue jay", ru: "Голубая сойка", uk: "Блакитна сойка", be: "Блакітная сойка" },
    blurb: {
      en: "A bright caller that caches nuts and chatters over the canopy.",
      ru: "Яркая крикунья — прячет орехи и перекликается над кронами.",
      uk: "Яскрава крикунка — ховає горіхи й перегукується над кронами.",
      be: "Яркая крыкуха — хавае арэхі і пераклікаецца над кронамі.",
    },
  },
  {
    slug: "magpie",
    name: { en: "Magpie", ru: "Сорока", uk: "Сорока", be: "Сарока" },
    blurb: {
      en: "Curious and quick — collects shiny scraps of food along twisting trails.",
      ru: "Любопытная и быстрая — подбирает лакомые находки на извилистых тропах.",
      uk: "Цікава й швидка — підбирає ласі знахідки на звивистих стежках.",
      be: "Цікаўная і хуткая — падбірае ласыя знаходкі на звілістых сцежках.",
    },
  },
  {
    slug: "mole",
    name: { en: "Mole", ru: "Крот", uk: "Кріт", be: "Крот" },
    blurb: {
      en: "Lives under the soil, pulling worms into a deep, dark pantry.",
      ru: "Живёт под землёй и тащит червяков в тёмную подземную кладовую.",
      uk: "Живе під землею і тягне черв'яків у темну підземну комору.",
      be: "Жыве пад зямлёй і цягне чарвякоў у цёмную падземную камору.",
    },
  },
  {
    slug: "raven",
    name: { en: "Raven", ru: "Ворон", uk: "Крук", be: "Крумкач" },
    blurb: {
      en: "A watchful black shape in the trees, patient for rich forest finds.",
      ru: "Чёрный страж крон — терпеливо ждёт богатых лесных находок.",
      uk: "Чорний страж крон — терпляче чекає багатих лісових знахідок.",
      be: "Чорны страж крон — цярпліва чакае багатых лясных знаходак.",
    },
  },
  {
    slug: "barn-owl",
    name: {
      en: "Barn owl",
      ru: "Обыкновенная сипуха",
      uk: "Звичайна сипуха",
      be: "Звычайная сіпуха",
    },
    blurb: {
      en: "Silent wings at dusk — listens for small meals along the path edges.",
      ru: "Бесшумные крылья в сумерках — слышит мелкую добычу у края тропы.",
      uk: "Безгучні крила в сутінках — чує дрібну здобич біля краю стежки.",
      be: "Бясшумныя крылы ў змярканні — чуе дробную здабычу ля краю сцежкі.",
    },
  },
  {
    slug: "mouse",
    name: { en: "Mouse", ru: "Мышь", uk: "Миша", be: "Мыш" },
    blurb: {
      en: "Tiny feet, big appetite for seeds and soft berries before frost.",
      ru: "Крошечные лапки и большой аппетит к семенам и мягким ягодам до морозов.",
      uk: "Крихітні лапки і великий апетит до насіння та м'яких ягод до морозів.",
      be: "Крышачныя лапкі і вялікі апетыт да насення і мяккіх ягад да маразоў.",
    },
  },
  {
    slug: "shrew",
    name: { en: "Shrew", ru: "Землеройка", uk: "Землерийка", be: "Землярыйка" },
    blurb: {
      en: "Always hungry — races after worms to keep warm through autumn nights.",
      ru: "Всегда голодна — гоняется за червяками, чтобы согреться осенними ночами.",
      uk: "Завжди голодна — ганяється за черв'яками, щоб зігрітися осінніми ночами.",
      be: "Заўсёды галодная — гоніцца за чарвякамі, каб сагрэцца восеньскімі начамі.",
    },
  },
  {
    slug: "squirrel",
    name: { en: "Squirrel", ru: "Белка", uk: "Білка", be: "Вавёрка" },
    blurb: {
      en: "A leaping hoarder of nuts, darting branch to branch above the paths.",
      ru: "Прыгучая запасливая хозяйка орехов — с ветки на ветку над тропами.",
      uk: "Стрибуча запаслива господиня горіхів — з гілки на гілку над стежками.",
      be: "Скакучая запасливая гаспадыня арэхаў — з галінкі на галінку над сцежкамі.",
    },
  },
  {
    slug: "woodpecker",
    name: { en: "Woodpecker", ru: "Дятел", uk: "Дятел", be: "Дзяцел" },
    blurb: {
      en: "Drums on bark and pulls insects where the trail meets old timber.",
      ru: "Барабанит по коре и достаёт насекомых там, где тропа касается старого дерева.",
      uk: "Барабанить по корі й дістає комах там, де стежка торкається старого дерева.",
      be: "Барабаніць па кары і дастае насякомых там, дзе сцежка кранае старога дрэва.",
    },
  },
  {
    slug: "chipmunk",
    name: { en: "Chipmunk", ru: "Бурундук", uk: "Бурундук", be: "Бурундук" },
    blurb: {
      en: "Cheek pouches full of seeds — a striped dash between roots and stones.",
      ru: "Защёчные мешочки полны семян — полосатый бегун между корнями и камнями.",
      uk: "Защічні мішечки повні насіння — смугастий бігун між корінням і камінням.",
      be: "Зашчочныя мяшэчкі поўныя насення — паласаты бягун паміж каранямі і камянямі.",
    },
  },
  {
    slug: "titmouse",
    name: { en: "Great tit", ru: "Большая синица", uk: "Велика синиця", be: "Вялікая сініца" },
    blurb: {
      en: "A lively songbird that picks eggs and worms from open path bends.",
      ru: "Живая певчая птица — собирает яйца и червяков на открытых изгибах троп.",
      uk: "Жвава співуча пташка — збирає яйця й черв'яків на відкритих згинах стежок.",
      be: "Жвавая спеўная птушка — збірае яйкі і чарвякоў на адкрытых згібах сцежак.",
    },
  },
  {
    slug: "wildcat",
    name: { en: "Wildcat", ru: "Дикий кот", uk: "Дикий кіт", be: "Дзікі кот" },
    blurb: {
      en: "Soft-footed and wary — stalks the forest edges for a careful feast.",
      ru: "Мягколапый и осторожный — крадётся по опушкам к своему неспешному пиру.",
      uk: "М'яколапий і обережний — крадеться узліссями до свого неквапливого бенкету.",
      be: "Мяккалапы і асцярожны — крадзецца ўзлескамі да сваёй няспешнай гасціны.",
    },
  },
  {
    slug: "pygmy-possum",
    name: {
      en: "Pygmy possum",
      ru: "Карликовый поссум",
      uk: "Карликовий посум",
      be: "Карлікавы пасум",
    },
    blurb: {
      en: "A tiny night climber that snuggles into warm pockets of food.",
      ru: "Крошечный ночной древолаз — устраивается в тёплых укромных запасах.",
      uk: "Крихітний нічний дереволаз — влаштовується в теплих затишних запасах.",
      be: "Крышачны начны дрэвалаз — уладкоўваецца ў цёплых зацішных запасах.",
    },
  },
  {
    slug: "chickadee",
    name: {
      en: "Chickadee",
      ru: "Карликовая гаичка",
      uk: "Карликова гаїчка",
      be: "Карлікавая гаічка",
    },
    blurb: {
      en: "A small winter voice among twigs, pecking what the path still holds.",
      ru: "Маленький зимний голосок в ветвях — клюёт то, что ещё лежит на тропе.",
      uk: "Маленький зимовий голосочок у гілках — клює те, що ще лежить на стежці.",
      be: "Маленькі зімовы галасок у галінах — дзяўбе тое, што яшчэ ляжыць на сцежцы.",
    },
  },
  {
    slug: "hamster",
    name: { en: "Hamster", ru: "Хомяк", uk: "Хом'як", be: "Хамяк" },
    blurb: {
      en: "Stuffs a burrow pantry with grains and berries for the long cold.",
      ru: "Набивает нору зерном и ягодами — кладовая к долгому холоду.",
      uk: "Набиває нору зерном і ягодами — комора до довгого холоду.",
      be: "Набівае нару зернем і ягадамі — камора да доўгай сцюжы.",
    },
  },
  // Advisors (art available; not in playable deck)
  {
    slug: "rooster",
    name: { en: "Rooster", ru: "Петух", uk: "Півень", be: "Певень" },
    blurb: {
      en: "Wakes the table early — the first to choose when dawn hits the forest.",
      ru: "Будит стол пораньше — первым выбирает, когда рассвет касается леса.",
      uk: "Будить стіл раніше — першим обирає, коли світанок торкається лісу.",
      be: "Будзіць стол раней — першым выбірае, калі світанак кранае лес.",
    },
  },
  {
    slug: "armadillo",
    name: { en: "Armadillo", ru: "Броненосец", uk: "Броненосець", be: "Браняносец" },
    blurb: {
      en: "Teaches deeper dens — one more space in an animal’s store.",
      ru: "Учит рыть глубже — ещё одно место в запасах животного.",
      uk: "Учить рити глибше — ще одне місце в запасах тварини.",
      be: "Вучыць рыць глыбей — яшчэ адно месца ў запасах жывёлы.",
    },
  },
  {
    slug: "goat",
    name: { en: "Goat", ru: "Козлик", uk: "Козлик", be: "Казлік" },
    blurb: {
      en: "Shares a drop of water that sweetens one kind of food.",
      ru: "Делится каплей воды, от которой один вид еды становится вкуснее.",
      uk: "Ділиться краплею води, від якої один вид їжі стає смачнішим.",
      be: "Дзеліцца кропляй вады, ад якой адзін від ежы становіцца смачнейшым.",
    },
  },
  {
    slug: "rabbit",
    name: { en: "Rabbit", ru: "Кролик", uk: "Кріль", be: "Трус" },
    blurb: {
      en: "Brings new neighbors into your forest from the animal paths.",
      ru: "Приводит новых соседей в ваш лес с троп животных.",
      uk: "Приводить нових сусідів у ваш ліс зі стежок тварин.",
      be: "Прыводзіць новых суседзяў у ваш лес са сцежак жывёл.",
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
