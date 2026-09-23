export interface Country {
  code: string;
  name: string;
  capital: string | null;
  flag: string;
}

export interface CountriesApiResponse {
  data: Country[];
  error?: string;
}
