// Make requests to CryptoCompare API
export async function makeApiRequest(path) {
  try {
    const response = await fetch(`https://min-api.cryptocompare.com/${path}`);
    return response.json();
  } catch (error) {
    throw new Error(`CryptoCompare request error: ${error.status}`);
  }
}

// Make requests to CryptoCompare API
export async function getBars() {
  try {

    const response = await fetch(`http://127.0.0.1:8000/get-bars`);
    return response.json();
  } catch (error) {
    throw new Error(`CryptoCompare request error: ${error.status}`);
  }
}

/*
export async function callBinanceFetch() {

  const ohlcv = await new ccxt.binance ().fetchOHLCV ('BTC/USDT', '1h');
  console.log('binance ohlc: ', ohlcv);
  return ohlcv;
}
*/

// Generate a symbol ID from a pair of the coins
export function generateSymbol(exchange, fromSymbol, toSymbol) {
  const short = `${fromSymbol}/${toSymbol}`;
  return {
    short,
    full: `${exchange}:${short}`,
  };
}

export function parseFullSymbol(fullSymbol) {
  const match = fullSymbol.match(/^(\w+):(\w+)\/(\w+)$/);
  if (!match) {
    return null;
  }

  return {
    exchange: match[1],
    fromSymbol: match[2],
    toSymbol: match[3],
  };
}
