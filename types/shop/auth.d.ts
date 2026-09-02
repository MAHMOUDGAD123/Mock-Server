declare namespace Shop {
  type CartItems = Record<string, number>;

  interface ServerUserInfo {
    filter: CategoryFilter;
    language: Language;
    cart: CartItems;
  }

  type ClientUserInfo = ServerUserInfo;
}
