declare namespace Shop {
  export interface CartRequestBody {
    productId: string;
    count?: number;
  }

  export interface FilterRequestBody {
    filter: CategoryFilter;
  }

  export interface LanguageRequestBody {
    lang: Language;
  }
}
