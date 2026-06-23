export type StockStatus = "En stock" | "Stock bajo" | "Stock crítico";

export type Product = {
  id: number;
  name: string;
  sku: string;
  category: string;
  stock: number;
  minimumStock: number;
  purchasePrice: number;
  salePrice: number;
  brand: string;
  unit: string;
  icon: string;
  iconTone: string;
  status: StockStatus;
};

export const products: Product[] = [
  {
    id: 1,
    name: "Coca-Cola 600 ml",
    sku: "7501055300886",
    category: "Bebidas",
    stock: 48,
    minimumStock: 20,
    purchasePrice: 11,
    salePrice: 16,
    brand: "Coca-Cola",
    unit: "Pieza",
    icon: "🥤",
    iconTone: "#e8f3f1",
    status: "En stock",
  },
  {
    id: 2,
    name: "Frijol pinto 1 kg",
    sku: "7503000413125",
    category: "Abarrotes",
    stock: 12,
    minimumStock: 18,
    purchasePrice: 21,
    salePrice: 28.5,
    brand: "La Sierra",
    unit: "Bolsa",
    icon: "🫘",
    iconTone: "#f2eee7",
    status: "Stock bajo",
  },
  {
    id: 3,
    name: "Leche entera 1 L",
    sku: "7501020531300",
    category: "Lácteos",
    stock: 35,
    minimumStock: 15,
    purchasePrice: 17,
    salePrice: 22,
    brand: "Lala",
    unit: "Cartón",
    icon: "🥛",
    iconTone: "#e9f1f8",
    status: "En stock",
  },
  {
    id: 4,
    name: "Sabritas clásicas 45 g",
    sku: "7500478003578",
    category: "Botanas",
    stock: 8,
    minimumStock: 15,
    purchasePrice: 13,
    salePrice: 18,
    brand: "Sabritas",
    unit: "Bolsa",
    icon: "🍟",
    iconTone: "#fff0c9",
    status: "Stock crítico",
  },
  {
    id: 5,
    name: "Arroz súper extra 1 kg",
    sku: "7501008012438",
    category: "Abarrotes",
    stock: 20,
    minimumStock: 24,
    purchasePrice: 18,
    salePrice: 24,
    brand: "Verde Valle",
    unit: "Bolsa",
    icon: "🌾",
    iconTone: "#f4efe3",
    status: "Stock bajo",
  },
  {
    id: 6,
    name: "Atún en agua 140 g",
    sku: "7501003104002",
    category: "Conservas",
    stock: 50,
    minimumStock: 18,
    purchasePrice: 14.5,
    salePrice: 19.5,
    brand: "Dolores",
    unit: "Lata",
    icon: "🐟",
    iconTone: "#e3f0f3",
    status: "En stock",
  },
  {
    id: 7,
    name: "Aceite vegetal 900 ml",
    sku: "7501040099001",
    category: "Aceites",
    stock: 15,
    minimumStock: 20,
    purchasePrice: 23.5,
    salePrice: 29.9,
    brand: "Nutrioli",
    unit: "Botella",
    icon: "🫗",
    iconTone: "#fff2cf",
    status: "Stock bajo",
  },
  {
    id: 8,
    name: "Azúcar estándar 1 kg",
    sku: "7501059612897",
    category: "Abarrotes",
    stock: 5,
    minimumStock: 15,
    purchasePrice: 13,
    salePrice: 18,
    brand: "Zulka",
    unit: "Bolsa",
    icon: "🧂",
    iconTone: "#f0f2f3",
    status: "Stock crítico",
  },
];

export const categories = [
  "Abarrotes",
  "Aceites",
  "Bebidas",
  "Botanas",
  "Conservas",
  "Lácteos",
];

export const units = ["Pieza", "Bolsa", "Botella", "Cartón", "Lata"];

export const productAttributes = [
  ["Sabor", "Original"],
  ["Contenido", "600 ml"],
  ["Retornable", "No"],
  ["Caducidad", "12 meses"],
] as const;
