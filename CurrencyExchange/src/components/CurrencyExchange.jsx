
import { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import BtcChart from './BtcChart';
import './CurrencyExchange.css';

const CurrencyExchange = () => {
  const [btcRates, setBtcRates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableCurrencies, setAvailableCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchBtcData = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get('http://13.214.66.96:3000/api/currency-data');

      if (Array.isArray(data) && data.length > 0) {
        const formattedData = data.map(entry => ({
          date: entry.date.split('T')[0],
          currency: entry.currency,
          rate: entry.btc,
        }));

        const uniqueDates = Array.from(new Set(formattedData.map(entry => entry.date))).sort((a, b) => new Date(b) - new Date(a));
        const uniqueCurrencies = Array.from(new Set(formattedData.map(entry => entry.currency)));

        setAvailableDates(uniqueDates);
        setAvailableCurrencies(uniqueCurrencies);
        setBtcRates(formattedData);

        if (uniqueDates.length > 0) {
          setSelectedDate(new Date(uniqueDates[0]));
        }
        if (uniqueCurrencies.includes('usd')) {
          setSelectedCurrency('usd');
        } else if (uniqueCurrencies.length > 0) {
          setSelectedCurrency(uniqueCurrencies[0]);
        }
      } else {
        setError('No data returned from the API.');
      }
    } catch (err) {
      console.error('Failed to fetch BTC data', err);
      setError('Failed to fetch BTC data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBtcData();
  }, []);

  const getCurrentRate = () => {
    if (!selectedDate || !selectedCurrency) return null;

    const formattedDate = selectedDate.toISOString().split('T')[0];
    const rateEntry = btcRates.find(entry => entry.date === formattedDate && entry.currency === selectedCurrency);
    return rateEntry ? rateEntry.rate : null;
  };

  return (
    <div className="exchange-container">
      <h1>BTC Exchange Rates</h1>

      <div className="date-picker">
        <label>Select Date:</label>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          dateFormat="yyyy-MM-dd"
          placeholderText="Select a date"
          filterDate={(date) => availableDates.includes(date.toISOString().split('T')[0])}
        />
      </div>

      <div className="currency-select">
        <label>Select Currency:</label>
        <select value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)} disabled={loading}>
          <option value="" disabled>Select currency</option>
          {availableCurrencies.map(currency => (
            <option key={currency} value={currency}>
              {currency.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <div className="rates">
          <h3>
            1 BTC = {getCurrentRate() !== null 
              ? parseFloat(getCurrentRate()).toLocaleString(undefined, { 
                 minimumFractionDigits: 2, 
                 maximumFractionDigits: 3 
                }) 
              : 'N/A'} {selectedCurrency.toUpperCase()} (on{' '}
            {selectedDate ? selectedDate.toISOString().split('T')[0] : 'N/A'})
          </h3>
        </div>
      )}

      <BtcChart availableCurrencies={availableCurrencies} selectedCurrency={selectedCurrency} />


      <div className="About">
        <button onClick={() => window.open('http://13.214.66.96:3000/about.html', '_blank')}>
          Go to About
        </button>
      </div>
    </div>
    
  );
};

export default CurrencyExchange;