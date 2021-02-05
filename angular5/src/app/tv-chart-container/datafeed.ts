import { generateSymbol, makeApiRequest, parseFullSymbol, getBars } from './helpers';
import { subscribeOnStream, unsubscribeFromStream } from './streaming';
import ccxt from 'ccxt';
import { ServerService } from './server.service';

// see https://github.com/tradingview/charting_library/wiki/JS-Api#onreadycallback
const configurationData = {
  supported_resolutions: ['1D', '1W', '1M', '1h', '1'],
  exchanges: [
    {
      value: 'Bitfinex',
      name: 'Bitfinex',
      desc: 'Bitfinex',
    },
    {
      value: 'Binance',
      name: 'Binance',
      desc: 'Binance',
    },
    {
      // `exchange` argument for the `searchSymbols` method, if a user selects this exchange
      value: 'Kraken',

      // filter name
      name: 'Kraken',

      // full exchange name displayed in the filter popup
      desc: 'Kraken bitcoin exchange',
    },
  ],
  symbols_types: [
    {
      name: 'crypto',

      // `symbolType` argument for the `searchSymbols` method, if a user selects this symbol type
      value: 'crypto',
    },
    // ...
  ],
};

const lastBarsCache = new Map();

export class Datafeed {

  constructor(private server: ServerService) {
  }
  /**
   * @see https://github.com/tradingview/charting_library/wiki/JS-Api#onreadycallback
   * @param callback
   */
  onReady(callback) {
    console.log('[onReady]: Method call');
    setTimeout(() => callback(configurationData));
  }

  async searchSymbols(userInput, exchange, symbolType, onResultReadyCallback) {
    console.log('[searchSymbols]: Method call');
    const symbols = await getAllSymbols();
    const newSymbols = symbols.filter(symbol => {
      const isExchangeValid = exchange === '' || symbol.exchange === exchange;
      const isFullSymbolContainsInput = symbol.full_name
        .toLowerCase()
        .indexOf(userInput.toLowerCase()) !== -1;
      return isExchangeValid && isFullSymbolContainsInput;
    });
    onResultReadyCallback(newSymbols);
  }

  async resolveSymbol(symbolName, onSymbolResolvedCallback, onResolveErrorCallback) {
    console.log('[resolveSymbol]: Method call', symbolName);
    const symbols = await getAllSymbols();
    const symbolItem = symbols.find(({ full_name }) => full_name === symbolName);
    if (!symbolItem) {
      console.log('[resolveSymbol]: Cannot resolve symbol', symbolName);
      onResolveErrorCallback('cannot resolve symbol');
      return;
    }
    const symbolInfo = {
      name: symbolItem.symbol,
      description: symbolItem.description,
      type: symbolItem.type,
      session: '24x7',
      timezone: 'Etc/UTC',
      exchange: symbolItem.exchange,
      minmov: 1,
      pricescale: 100,
      has_intraday: true,
      has_no_volume: true,
      has_weekly_and_monthly: false,
      supported_resolutions: configurationData.supported_resolutions,
      volume_precision: 2,
      data_status: 'streaming',
    };

    console.log('[resolveSymbol]: Symbol resolved', symbolName);
    onSymbolResolvedCallback(symbolInfo);
  }

  async getBars(symbolInfo, resolution, from, to, onHistoryCallback, onErrorCallback, firstDataRequest) {
    console.log('[getBars]: Method call', symbolInfo);
    const parsedSymbol = parseFullSymbol(symbolInfo.full_name);
    const urlParameters = {
      e: parsedSymbol.exchange,
      fsym: parsedSymbol.fromSymbol,
      tsym: parsedSymbol.toSymbol,
      toTs: to,
      limit: 2000,
    };
    const query = Object.keys(urlParameters)
      .map(name => `${name}=${encodeURIComponent(urlParameters[name])}`)
      .join('&');
    try {
/*
      const exchangeId = 'binance'
        , exchangeClass = ccxt[exchangeId]
        , binance = new exchangeClass ({
        'timeout': 30000,
        'enableRateLimit': true,
      });
      binance.proxy = 'http://localhost:4200/api/';
      const params = {
        'startTime': from * 1000,
        'endTime': to * 1000
      };

      // const ohlcv = await binance.fetchOHLCV(symbolInfo.name, '1m');
      const ohlcv = await binance.fetchOHLCV(symbolInfo.name, '1m', from * 1000, 1000, params);
      console.log('binance ohlc: ', ohlcv);
*/
      const data = this.server.getBars();
      console.log('data: ', data);
      /*
      if (data.Response && data.Response === 'Error' || data.Data.length === 0) {
        // "noData" should be set if there is no data in the requested period.
        onHistoryCallback([], { noData: true });
        return;
      }
       */
      /*
       */
      let bars = [];
      data.forEach(bar => {
        if (bar[0] >= from && bar[0] < to) {
          bars = [...bars, {
            time: bar[0], // * 1000,
            low: bar[3],
            high: bar[2],
            open: bar[1],
            close: bar[4],
          }];
        }
      });
      /*
      let cbars = [];
      ohlcv.forEach(bar => {
        if (bar[0] >= (from * 1000) && bar[0] < (to * 1000)) {
          bars = [...bars, {
            time: bar[0],
            low: bar[3],
            high: bar[2],
            open: bar[1],
            close: bar[4],
          }];
        }
      });
       */
      if (firstDataRequest) {
        lastBarsCache.set(symbolInfo.full_name, { ...bars[bars.length - 1] });
      }
      console.log(`[getBars]: returned ${bars.length} bar(s)`);
      onHistoryCallback(bars, { noData: false });
    } catch (error) {
      console.log('[getBars]: Get error', error);
      onErrorCallback(error);
    }
  }

  subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscribeUID, onResetCacheNeededCallback) {
    console.log('[subscribeBars]: Method call with subscribeUID:', subscribeUID);
    subscribeOnStream(
      symbolInfo,
      resolution,
      onRealtimeCallback,
      subscribeUID,
      onResetCacheNeededCallback,
      lastBarsCache.get(symbolInfo.full_name)
    );
  }

  unsubscribeBars(subscriberUID) {
    console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID);
    unsubscribeFromStream(subscriberUID);
  }
}

async function getAllSymbols() {
  const data = await makeApiRequest('data/v3/all/exchanges');
  let allSymbols = [];

  for (const exchange of configurationData.exchanges) {
    const pairs = data.Data[exchange.value].pairs;

    for (const leftPairPart of Object.keys(pairs)) {
      const symbols = pairs[leftPairPart].map(rightPairPart => {
        const symbol = generateSymbol(exchange.value, leftPairPart, rightPairPart);
        return {
          symbol: symbol.short,
          full_name: symbol.full,
          description: symbol.short,
          exchange: exchange.value,
          type: 'crypto',
        };
      });
      allSymbols = [...allSymbols, ...symbols];
    }
  }
  return allSymbols;
}
