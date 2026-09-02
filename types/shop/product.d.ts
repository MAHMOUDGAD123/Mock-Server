declare namespace Shop {
  type LocalizedString = {
    en: string;
    ar: string;
  };

  type ProductReviewRate = 1 | 2 | 3 | 4 | 5;

  interface Review {
    customerName: LocalizedString;
    description: LocalizedString;
    reviewStars: ProductReviewRate;
  }

  interface Product {
    id: string;
    title: LocalizedString;
    shortName: LocalizedString;
    description: LocalizedString;
    price: number;
    discount: number;
    category: { en: Category; ar: string };
    reviews: Review[];
    isBestSeller: boolean;
  }

  interface ProductWithMetaData extends Product {
    inCart: boolean;
    cartCount: number;
    img: string;
  }

  interface ServerProductsStore {
    list: Product[];
    categories: Category[];
    itemCount: number;
  }

  type ClientProductsStore = Omit<ServerProductsStore, "list"> & {
    list: ProductWithMetaData[];
  };

  type ProductIdLookup = Record<string, Product>;

  type Category = "coffee" | "equipment" | "roasting";

  type CategoryFilter = Category | "best" | "offer" | "all";
}
