export type Gender = 'Mr' | 'Mrs';

export interface UserCredentials {
  email: string;
  password: string;
}

export interface AddressInfo {
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  country: Country;
  state: string;
  city: string;
  zipcode: string;
  mobileNumber: string;
}

export interface DateOfBirth {
  day: string;
  month: string;
  year: string;
}

export interface UserAccount extends UserCredentials, AddressInfo {
  name: string;
  gender: Gender;
  dateOfBirth: DateOfBirth;
  newsletter: boolean;
  offers: boolean;
}

export type Country =
  | 'India'
  | 'United States'
  | 'Canada'
  | 'Australia'
  | 'Israel'
  | 'New Zealand'
  | 'Singapore';

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  attachmentPath?: string;
}

export interface CardDetails {
  nameOnCard: string;
  cardNumber: string;
  cvc: string;
  expiryMonth: string;
  expiryYear: string;
}

export interface ProductReview {
  name: string;
  email: string;
  review: string;
}

export interface ProductDetails {
  name: string;
  category: string;
  price: string;
  availability: string;
  condition: string;
  brand: string;
}

export interface CartRow {
  name: string;
  price: string;
  quantity: number;
  total: string;
}

/**
 * Mutable bag shared across the Given/When/Then steps of a single BDD scenario.
 * Playwright resolves the `scenarioState` fixture once per test, so every step
 * function for that scenario receives the same object.
 */
export interface ScenarioState {
  user?: UserAccount;
  accountDeleted?: boolean;
  addedProducts?: string[];
  searchResults?: string[];
  productDetails?: ProductDetails;
  invoicePath?: string;
  message?: ContactMessage;
  brands?: string[];
}
