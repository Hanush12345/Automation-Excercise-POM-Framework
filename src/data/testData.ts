export const MESSAGES = {
  loginToAccount: 'Login to your account',
  newUserSignup: 'New User Signup!',
  enterAccountInformation: 'Enter Account Information',
  accountCreated: 'Account Created!',
  accountDeleted: 'Account Deleted!',
  incorrectCredentials: 'Your email or password is incorrect!',
  emailAlreadyExists: 'Email Address already exist!',
  loggedInAs: 'Logged in as',
  subscriptionSuccess: 'You have been successfully subscribed!',
  contactSuccess: 'Success! Your details have been submitted successfully.',
  reviewSuccess: 'Thank you for your review.',
  orderPlaced: 'Order Placed!',
  orderConfirmation: 'Congratulations! Your order has been confirmed!',
  addedToCart: 'Your product has been added to cart.',
  cartEmpty: 'Cart is empty!',
  subscriptionHeading: 'Subscription',
} as const;

export const HEADINGS = {
  allProducts: 'All Products',
  searchedProducts: 'Searched Products',
  writeYourReview: 'Write Your Review',
  addressDetails: 'Address Details',
  reviewYourOrder: 'Review Your Order',
  recommendedItems: 'recommended items',
} as const;

export const CATEGORIES = {
  women: { name: 'Women', subCategories: { dress: 1, tops: 2, saree: 7 } },
  men: { name: 'Men', subCategories: { tshirts: 3, jeans: 6 } },
  kids: { name: 'Kids', subCategories: { dress: 4, topsShirts: 5 } },
} as const;

export const BRANDS = ['Polo', 'H&M', 'Madame', 'Mast & Harbour', 'Babyhug', 'Allen Solly Junior', 'Kookie Kids', 'Biba'] as const;

export const SEARCH_TERMS = {
  valid: 'Top',
  alternate: 'Dress',
  noResults: 'zzzzqqqnotaproduct',
} as const;

/** Known-stable product ids on this site. Verify before relying on them in CI. */
export const PRODUCT_IDS = {
  blueTop: 1,
  menTshirt: 2,
  sleevelessDress: 3,
} as const;

export const QUANTITY = { multiple: 4 } as const;
