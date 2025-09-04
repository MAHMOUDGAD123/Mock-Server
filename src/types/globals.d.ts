declare namespace Globals {
  type EnvironmentMode = "development" | "production";
}

declare namespace Database {
  type PostInfoType = {
    userId: number;
    id: number;
    title: string;
    body: string;
  }

  type UserInfoType = {
    id: number;
    name: string;
    username: string;
    email: string;
    address: {
      street: string;
      suite: string;
      city: string;
      zipcode: string;
      geo: {
        lat: string;
        lng: string;
      };
    };
    phone: string;
    website: string;
    company: {
      name: string;
      catchPhrase: string;
      bs: string;
    };
  }


}
