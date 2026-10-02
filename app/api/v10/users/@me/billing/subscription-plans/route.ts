import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json([
    {
      id: '511651880837840896',
      name: 'Nitro Monthly',
      interval: 1, // Month
      interval_count: 1,
      tax_inclusive: true,
      sku_id: '521847234246082599',
      currency: 'eur',
      price: 999,
      prices: {
        '0': {
          country_prices: {
            country_code: 'ES',
            prices: [{ currency: 'eur', amount: 999, exponent: 2 }],
          },
        },
      },
    },
    {
      id: '511651885459963904',
      name: 'Nitro Yearly',
      interval: 2, // Year
      interval_count: 1,
      tax_inclusive: true,
      sku_id: '521847234246082599',
      currency: 'eur',
      price: 9999,
      prices: {
        '0': {
          country_prices: {
            country_code: 'ES',
            prices: [{ currency: 'eur', amount: 9999, exponent: 2 }],
          },
        },
      },
    },
    {
      id: '511651871736201216',
      name: 'Nitro Classic Monthly',
      interval: 1,
      interval_count: 1,
      tax_inclusive: true,
      sku_id: '521846918637420545',
      currency: 'eur',
      price: 499,
      prices: {
        '0': {
          country_prices: {
            country_code: 'ES',
            prices: [{ currency: 'eur', amount: 499, exponent: 2 }],
          },
        },
      },
    },
    {
      id: '978380692553465866',
      name: 'Nitro Basic Monthly',
      interval: 1,
      interval_count: 1,
      tax_inclusive: true,
      sku_id: '978380684370378762',
      currency: 'eur',
      price: 299,
      prices: {
        '0': {
          country_prices: {
            country_code: 'ES',
            prices: [{ currency: 'eur', amount: 299, exponent: 2 }],
          },
        },
      },
    },
    {
      id: '978387023482069042',
      name: 'Nitro Basic Monthly (Alt)',
      interval: 1,
      interval_count: 1,
      tax_inclusive: true,
      sku_id: '978380684370378762',
      currency: 'eur',
      price: 299,
      prices: {
        '0': {
          country_prices: {
            country_code: 'ES',
            prices: [{ currency: 'eur', amount: 299, exponent: 2 }],
          },
        },
      },
    },
    {
      id: '590665532894740483',
      name: 'Server Boost Monthly',
      interval: 1,
      interval_count: 1,
      tax_inclusive: true,
      sku_id: '590663762298667008',
      currency: 'eur',
      price: 349,
      prices: {
        '0': {
          country_prices: {
            country_code: 'ES',
            prices: [{ currency: 'eur', amount: 349, exponent: 2 }],
          },
        },
      },
    },
  ])
}
