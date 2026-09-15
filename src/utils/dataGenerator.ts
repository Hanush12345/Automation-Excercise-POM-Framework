import { faker } from '@faker-js/faker';
import { CardDetails, ContactMessage, ProductReview, UserAccount } from '../types';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

/** Unique, routable-looking address. The site never sends mail, so a timestamped alias is safe. */
export function uniqueEmail(prefix = 'qa.auto'): string {
  return `${prefix}.${Date.now()}.${faker.string.alphanumeric(5).toLowerCase()}@mailinator.com`;
}

export function buildUser(overrides: Partial<UserAccount> = {}): UserAccount {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    name: `${firstName} ${lastName}`,
    email: uniqueEmail(),
    password: 'Passw0rd!123',
    gender: faker.helpers.arrayElement(['Mr', 'Mrs']),
    dateOfBirth: {
      day: String(faker.number.int({ min: 1, max: 28 })),
      month: faker.helpers.arrayElement(MONTHS),
      year: String(faker.number.int({ min: 1970, max: 2003 })),
    },
    newsletter: true,
    offers: true,
    firstName,
    lastName,
    company: faker.company.name(),
    address1: faker.location.streetAddress(),
    address2: faker.location.secondaryAddress(),
    country: 'India',
    state: faker.location.state(),
    city: faker.location.city(),
    zipcode: faker.location.zipCode('######'),
    mobileNumber: faker.string.numeric(10),
    ...overrides,
  };
}

export function buildContactMessage(overrides: Partial<ContactMessage> = {}): ContactMessage {
  return {
    name: faker.person.fullName(),
    email: uniqueEmail('qa.contact'),
    subject: `Automated enquiry ${faker.string.alphanumeric(6).toUpperCase()}`,
    message: faker.lorem.paragraph(),
    ...overrides,
  };
}

export function buildCard(nameOnCard: string): CardDetails {
  return {
    nameOnCard,
    cardNumber: '4111111111111111',
    cvc: faker.string.numeric(3),
    expiryMonth: '12',
    expiryYear: String(new Date().getFullYear() + 3),
  };
}

export function buildReview(overrides: Partial<ProductReview> = {}): ProductReview {
  return {
    name: faker.person.fullName(),
    email: uniqueEmail('qa.review'),
    review: faker.lorem.sentences(2),
    ...overrides,
  };
}
