import 'dotenv/config';
import { GoogleAdsApi } from 'google-ads-api';

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});
console.log('client methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(client)).join(', '));
const customer = client.Customer({
  customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || undefined,
});
console.log('customer proto:', Object.getOwnPropertyNames(Object.getPrototypeOf(customer)).slice(0, 80).join(', '));
console.log('customer own:', Object.keys(customer).slice(0, 40).join(', '));
