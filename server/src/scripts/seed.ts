import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import mongoose, { Model } from 'mongoose';
import { Brand, BrandSchema } from '../brands/schemas/brand.schema';
import { Category, CategorySchema } from '../categories/schemas/category.schema';
import { Role } from '../common/enums/role.enum';
import { slugify } from '../common/utils/slug.util';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

dotenv.config();

const localImage = (fileName: string) => `/products/${fileName}`;

const extraSpecificationsByCategory: Record<
  string,
  Array<{ label: string; value: string }>
> = {
  Холодильники: [
    { label: 'Высота', value: '200-203 см' },
    { label: 'Уровень шума', value: '35-39 дБ' },
    { label: 'Энергопотребление', value: 'A++ / A+++' },
  ],
  'Стиральные машины': [
    { label: 'Класс стирки', value: 'A' },
    { label: 'Тип загрузки', value: 'Фронтальная' },
    { label: 'Глубина', value: '52-60 см' },
  ],
  'Посудомоечные машины': [
    { label: 'Количество программ', value: '6-8' },
    { label: 'Защита от протечек', value: 'Полная' },
    { label: 'Расход воды', value: '9-11 л за цикл' },
  ],
  Пылесосы: [
    { label: 'Уровень шума', value: '72-79 дБ' },
    { label: 'Фильтрация', value: 'HEPA' },
    { label: 'Вес', value: '2.6-7.0 кг' },
  ],
  'Кухонная техника': [
    { label: 'Материал корпуса', value: 'Металл / пластик' },
    { label: 'Режимы работы', value: 'Автоматические программы' },
    { label: 'Гарантия', value: '12 месяцев' },
  ],
  'Встраиваемая техника': [
    { label: 'Цвет', value: 'Черный / нержавеющая сталь' },
    { label: 'Ширина', value: '60 см' },
    { label: 'Управление', value: 'Сенсорное / поворотное' },
  ],
};

const withExtraSpecifications = <T extends { category: string; specifications: Array<{ label: string; value: string }> }>(
  product: T,
) => {
  const extraSpecifications = extraSpecificationsByCategory[product.category] ?? [];
  const usedLabels = new Set(product.specifications.map((item) => item.label));

  return {
    ...product,
    specifications: [
      ...product.specifications,
      ...extraSpecifications.filter((item) => !usedLabels.has(item.label)),
    ],
  };
};

const categories = [
  {
    name: 'Холодильники',
    description: 'Отдельностоящие и многодверные модели для современной кухни.',
  },
  {
    name: 'Стиральные машины',
    description: 'Модели с паром, сушкой и инверторными моторами.',
  },
  {
    name: 'Посудомоечные машины',
    description: 'Встраиваемые и отдельностоящие решения на 9–14 комплектов.',
  },
  {
    name: 'Пылесосы',
    description: 'Роботы, вертикальные и моющие модели для квартиры и дома.',
  },
  {
    name: 'Кухонная техника',
    description: 'Микроволновые печи, кофемашины, мультиварки и мелкая техника.',
  },
  {
    name: 'Встраиваемая техника',
    description: 'Духовые шкафы, варочные панели и готовые решения для кухни.',
  },
];

const brands = [
  'Candy',
  'Hoover',
  'LG',
  'Samsung',
  'Bosch',
  'Haier',
  'Philips',
  'Xiaomi',
  'Midea',
  'DeLonghi',
];

const products = [
  {
    title: 'Candy Fresco CCE4T618EW',
    description:
      'Двухкамерный холодильник с Total No Frost, зоной свежести и инверторным компрессором для ежедневной семьи.',
    price: 76990,
    oldPrice: 83990,
    brand: 'Candy',
    category: 'Холодильники',
    stock: 12,
    rating: 4.7,
    isPopular: true,
    images: [localImage('fridge-kitchen-bright.jpg')],
    specifications: [
      { label: 'Объем', value: '377 л' },
      { label: 'No Frost', value: 'Да' },
      { label: 'Компрессор', value: 'Инверторный' },
    ],
  },
  {
    title: 'LG InstaView GC-Q257CBFC',
    description:
      'Вместительный side-by-side холодильник с InstaView, охлаждением DoorCooling+ и премиальным внутренним пространством.',
    price: 189990,
    oldPrice: 204990,
    brand: 'LG',
    category: 'Холодильники',
    stock: 6,
    rating: 4.8,
    isPopular: true,
    images: [localImage('fridge-kitchen-bright.jpg')],
    specifications: [
      { label: 'Объем', value: '674 л' },
      { label: 'DoorCooling+', value: 'Да' },
      { label: 'Зона свежести', value: 'Да' },
    ],
  },
  {
    title: 'Haier HB18FGSAAA',
    description:
      'Четырехдверный холодильник с зоной Humidity Zone, складными полками и экономичным охлаждением.',
    price: 159990,
    oldPrice: 169990,
    brand: 'Haier',
    category: 'Холодильники',
    stock: 4,
    rating: 4.6,
    isPopular: true,
    images: [localImage('fridge-magnets.jpg')],
    specifications: [
      { label: 'Объем', value: '508 л' },
      { label: 'Класс', value: 'A++' },
      { label: 'Тип', value: 'French Door' },
    ],
  },
  {
    title: 'Samsung RB38A7B6AB1',
    description:
      'Холодильник с SpaceMax, тихим компрессором и равномерным охлаждением задней стенки.',
    price: 102990,
    oldPrice: 112990,
    brand: 'Samsung',
    category: 'Холодильники',
    stock: 7,
    rating: 4.7,
    isPopular: false,
    images: [localImage('fridge-magnets.jpg')],
    specifications: [
      { label: 'Объем', value: '390 л' },
      { label: 'SpaceMax', value: 'Да' },
      { label: 'Шум', value: '35 дБ' },
    ],
  },
  {
    title: 'Candy RapidO RO1484DWMCRT',
    description:
      'Стиральная машина с набором быстрых программ, паровой обработкой и удаленным управлением по Wi‑Fi.',
    price: 54990,
    oldPrice: 60990,
    brand: 'Candy',
    category: 'Стиральные машины',
    stock: 11,
    rating: 4.6,
    isPopular: true,
    images: [localImage('washer-closeup.jpg')],
    specifications: [
      { label: 'Загрузка', value: '8 кг' },
      { label: 'Отжим', value: '1400 об/мин' },
      { label: 'Wi‑Fi', value: 'Да' },
    ],
  },
  {
    title: 'Samsung WW90T554CAT',
    description:
      'Модель с EcoBubble, интеллектуальными сценариями стирки и программой паровой обработки белья.',
    price: 67990,
    oldPrice: 74990,
    brand: 'Samsung',
    category: 'Стиральные машины',
    stock: 10,
    rating: 4.7,
    isPopular: true,
    images: [localImage('washer-closeup.jpg')],
    specifications: [
      { label: 'Загрузка', value: '9 кг' },
      { label: 'Парообработка', value: 'Да' },
      { label: 'EcoBubble', value: 'Да' },
    ],
  },
  {
    title: 'Bosch WGG244F0ME',
    description:
      'Полноразмерная стиральная машина с EcoSilence Drive, AquaStop и тихой ночной стиркой.',
    price: 82990,
    oldPrice: 89990,
    brand: 'Bosch',
    category: 'Стиральные машины',
    stock: 9,
    rating: 4.8,
    isPopular: false,
    images: [localImage('washer-closeup.jpg')],
    specifications: [
      { label: 'Загрузка', value: '9 кг' },
      { label: 'AquaStop', value: 'Да' },
      { label: 'Мотор', value: 'EcoSilence Drive' },
    ],
  },
  {
    title: 'Hoover H-WASH 500 HWP414AMBC',
    description:
      'Стиральная машина Hoover с автоматическим дозированием моющего средства и связкой с мобильным приложением.',
    price: 59990,
    oldPrice: 65990,
    brand: 'Hoover',
    category: 'Стиральные машины',
    stock: 8,
    rating: 4.5,
    isPopular: false,
    images: [localImage('washer-closeup.jpg')],
    specifications: [
      { label: 'Загрузка', value: '14 кг' },
      { label: 'Автодозирование', value: 'Да' },
      { label: 'Управление', value: 'App + Wi‑Fi' },
    ],
  },
  {
    title: 'Candy Brava CDPH 2L1049W',
    description:
      'Компактная посудомоечная машина с коротким циклом 32 минуты и удобной загрузкой для небольшой кухни.',
    price: 36990,
    oldPrice: 40990,
    brand: 'Candy',
    category: 'Посудомоечные машины',
    stock: 14,
    rating: 4.5,
    isPopular: true,
    images: [localImage('dishwasher-open.jpg')],
    specifications: [
      { label: 'Комплекты', value: '10' },
      { label: 'Ширина', value: '45 см' },
      { label: 'Быстрая программа', value: '32 мин' },
    ],
  },
  {
    title: 'Bosch SMV4HVX31E',
    description:
      'Полновстраиваемая модель с Home Connect, тихим двигателем и продуманными корзинами для крупной посуды.',
    price: 59990,
    oldPrice: 65990,
    brand: 'Bosch',
    category: 'Посудомоечные машины',
    stock: 8,
    rating: 4.6,
    isPopular: false,
    images: [localImage('dishwasher-open.jpg')],
    specifications: [
      { label: 'Комплекты', value: '13' },
      { label: 'Шум', value: '46 дБ' },
      { label: 'Home Connect', value: 'Да' },
    ],
  },
  {
    title: 'Midea MID60S100i',
    description:
      'Встраиваемая посудомоечная машина с конденсационной сушкой и набором автоматических программ.',
    price: 47990,
    oldPrice: 52990,
    brand: 'Midea',
    category: 'Посудомоечные машины',
    stock: 13,
    rating: 4.4,
    isPopular: false,
    images: [localImage('dishwasher-open.jpg')],
    specifications: [
      { label: 'Комплекты', value: '14' },
      { label: 'Сушка', value: 'Конденсационная' },
      { label: 'Класс', value: 'A++' },
    ],
  },
  {
    title: 'Hoover HF522NPW 011',
    description:
      'Вертикальный беспроводной пылесос для ежедневной сухой уборки с настенным хранением и сменными насадками.',
    price: 28990,
    oldPrice: 32990,
    brand: 'Hoover',
    category: 'Пылесосы',
    stock: 16,
    rating: 4.5,
    isPopular: true,
    images: [localImage('vacuum-cordless.jpg')],
    specifications: [
      { label: 'Тип', value: 'Вертикальный' },
      { label: 'Время работы', value: '45 мин' },
      { label: 'Контейнер', value: '0.45 л' },
    ],
  },
  {
    title: 'Xiaomi Robot Vacuum X20+',
    description:
      'Робот-пылесос со станцией самоочистки, лидарной навигацией и влажной уборкой по картам помещения.',
    price: 49990,
    oldPrice: 55990,
    brand: 'Xiaomi',
    category: 'Пылесосы',
    stock: 14,
    rating: 4.5,
    isPopular: true,
    images: [localImage('vacuum-robot.jpg')],
    specifications: [
      { label: 'Мощность', value: '6000 Па' },
      { label: 'Навигация', value: 'LDS' },
      { label: 'Станция', value: 'Автоочистка' },
    ],
  },
  {
    title: 'Philips AquaTrio Cordless 9000',
    description:
      'Моющий пылесос для сухой и влажной уборки с быстрой очисткой роликов и удобной базой зарядки.',
    price: 72990,
    oldPrice: 78990,
    brand: 'Philips',
    category: 'Пылесосы',
    stock: 5,
    rating: 4.4,
    isPopular: false,
    images: [localImage('vacuum-cordless.jpg')],
    specifications: [
      { label: 'Уборка', value: 'Сухая / влажная' },
      { label: 'Автономность', value: '45 мин' },
      { label: 'Аккумулятор', value: 'Li-Ion' },
    ],
  },
  {
    title: 'Candy CMXW20DW',
    description:
      'СВЧ-печь с простым электронным управлением, автоматическими программами разогрева и разморозки.',
    price: 11990,
    oldPrice: 13990,
    brand: 'Candy',
    category: 'Кухонная техника',
    stock: 21,
    rating: 4.3,
    isPopular: false,
    images: [localImage('microwave-counter.jpg')],
    specifications: [
      { label: 'Объем', value: '20 л' },
      { label: 'Мощность', value: '700 Вт' },
      { label: 'Управление', value: 'Электронное' },
    ],
  },
  {
    title: 'Philips LatteGo EP5447/90',
    description:
      'Автоматическая кофемашина с LatteGo, керамической кофемолкой и персональными профилями напитков.',
    price: 89990,
    oldPrice: 97990,
    brand: 'Philips',
    category: 'Кухонная техника',
    stock: 9,
    rating: 4.8,
    isPopular: true,
    images: [localImage('coffee-machine-kitchen.jpg')],
    specifications: [
      { label: 'Напитки', value: '12 рецептов' },
      { label: 'Кофемолка', value: 'Керамическая' },
      { label: 'Milk system', value: 'LatteGo' },
    ],
  },
  {
    title: 'DeLonghi Magnifica Evo ECAM290.61.SB',
    description:
      'Компактная автоматическая кофемашина с сенсорной панелью, капучинатором и быстрым нагревом.',
    price: 74990,
    oldPrice: 81990,
    brand: 'DeLonghi',
    category: 'Кухонная техника',
    stock: 6,
    rating: 4.7,
    isPopular: false,
    images: [localImage('coffee-machine-counter.jpg')],
    specifications: [
      { label: 'Капучино', value: 'Автоматическое' },
      { label: 'Резервуар', value: '1.8 л' },
      { label: 'Профили', value: '4 напитка' },
    ],
  },
  {
    title: 'Midea MPC-6003',
    description:
      'Мультиварка-скороварка с набором программ для супов, каш, тушения и приготовления на пару.',
    price: 9990,
    oldPrice: 11990,
    brand: 'Midea',
    category: 'Кухонная техника',
    stock: 18,
    rating: 4.2,
    isPopular: false,
    images: [localImage('microwave-counter.jpg')],
    specifications: [
      { label: 'Объем', value: '5 л' },
      { label: 'Мощность', value: '1000 Вт' },
      { label: 'Программы', value: '12' },
    ],
  },
  {
    title: 'Candy FCT615XL',
    description:
      'Встраиваемый духовой шкаф с конвекцией, телескопическими направляющими и каталитической очисткой.',
    price: 45990,
    oldPrice: 51990,
    brand: 'Candy',
    category: 'Встраиваемая техника',
    stock: 10,
    rating: 4.5,
    isPopular: true,
    images: [localImage('oven-open.jpg')],
    specifications: [
      { label: 'Объем', value: '70 л' },
      { label: 'Конвекция', value: 'Да' },
      { label: 'Очистка', value: 'Каталитическая' },
    ],
  },
  {
    title: 'Candy CH64CCB',
    description:
      'Электрическая варочная панель с четырьмя конфорками и удобным управлением для повседневного приготовления.',
    price: 24990,
    oldPrice: 27990,
    brand: 'Candy',
    category: 'Встраиваемая техника',
    stock: 13,
    rating: 4.4,
    isPopular: false,
    images: [localImage('oven-microwave-builtin.jpg')],
    specifications: [
      { label: 'Конфорки', value: '4' },
      { label: 'Тип панели', value: 'Стеклокерамика' },
      { label: 'Ширина', value: '60 см' },
    ],
  },
  {
    title: 'Bosch HBG5370B0',
    description:
      'Духовой шкаф Bosch с 3D Hotair, автопрограммами и точным электронным управлением.',
    price: 68990,
    oldPrice: 74990,
    brand: 'Bosch',
    category: 'Встраиваемая техника',
    stock: 7,
    rating: 4.8,
    isPopular: false,
    images: [localImage('oven-microwave-builtin.jpg')],
    specifications: [
      { label: 'Режимы', value: '10' },
      { label: '3D Hotair', value: 'Да' },
      { label: 'Автопрограммы', value: 'AutoPilot' },
    ],
  },
  {
    title: 'Samsung NZ64T3516QK',
    description:
      'Индукционная варочная панель с быстрым нагревом, таймерами зон и современным черным стеклом.',
    price: 41990,
    oldPrice: 46990,
    brand: 'Samsung',
    category: 'Встраиваемая техника',
    stock: 8,
    rating: 4.6,
    isPopular: true,
    images: [localImage('oven-open.jpg')],
    specifications: [
      { label: 'Тип', value: 'Индукция' },
      { label: 'Конфорки', value: '4' },
      { label: 'Booster', value: 'Да' },
    ],
  },
];

async function run() {
  const mongoUri =
    process.env.MONGODB_URI || 'mongodb://localhost:27017/appliance-store';
  await mongoose.connect(mongoUri);

  const CategoryModel: Model<Category> = mongoose.model(
    Category.name,
    CategorySchema,
  );
  const BrandModel: Model<Brand> = mongoose.model(Brand.name, BrandSchema);
  const ProductModel: Model<Product> = mongoose.model(Product.name, ProductSchema);
  const UserModel: Model<User> = mongoose.model(User.name, UserSchema);

  await ProductModel.deleteMany({});
  await CategoryModel.deleteMany({});
  await BrandModel.deleteMany({});

  const createdCategories = await CategoryModel.insertMany(
    categories.map((category) => ({
      ...category,
      slug: slugify(category.name),
    })),
  );

  const createdBrands = await BrandModel.insertMany(
    brands.map((name) => ({
      name,
      slug: slugify(name),
    })),
  );

  const categoryMap = new Map(createdCategories.map((item) => [item.name, item._id]));
  const brandMap = new Map(createdBrands.map((item) => [item.name, item._id]));

  await ProductModel.insertMany(
    products.map((product) => {
      const preparedProduct = withExtraSpecifications(product);

      return {
        ...preparedProduct,
        rating: 0,
        reviewCount: 0,
        category: categoryMap.get(product.category),
        brand: brandMap.get(product.brand),
      };
    }),
  );

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@diplom-store.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  const demoUserPassword = process.env.DEMO_USER_PASSWORD || 'User123!';

  await UserModel.findOneAndUpdate(
    { email: adminEmail.toLowerCase() },
    {
      email: adminEmail.toLowerCase(),
      passwordHash: await bcrypt.hash(adminPassword, 10),
      name: 'Store Admin',
      phone: '+7 (900) 000-00-00',
      role: Role.ADMIN,
      address: 'Moscow, Main Office',
    },
    { upsert: true, new: true },
  );

  await UserModel.findOneAndUpdate(
    { email: 'user@diplom-store.local' },
    {
      email: 'user@diplom-store.local',
      passwordHash: await bcrypt.hash(demoUserPassword, 10),
      name: 'Demo User',
      phone: '+7 (901) 111-22-33',
      role: Role.USER,
      address: 'Moscow, Tverskaya 1',
    },
    { upsert: true, new: true },
  );

  console.log(`Seed completed: ${products.length} products, ${brands.length} brands`);
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`Demo user: user@diplom-store.local / ${demoUserPassword}`);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('Seed failed', error);
  await mongoose.disconnect();
  process.exit(1);
});
