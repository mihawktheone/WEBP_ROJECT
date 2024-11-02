import { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import BtcChart from './BtcChart';

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
      console.log("Full API Data:", data);

      if (Array.isArray(data) && data.length > 0) {
        const formattedData = data.map(entry => ({
          date: entry.date.split('T')[0],
          currency: entry.currency,
          rate: entry.btc
        }));

        const uniqueDates = Array.from(new Set(formattedData.map(entry => entry.date))).sort((a, b) => new Date(b) - new Date(a));
        const uniqueCurrencies = Array.from(new Set(formattedData.map(entry => entry.currency)));

        setAvailableDates(uniqueDates);
        setAvailableCurrencies(uniqueCurrencies);
        setBtcRates(formattedData);

        // Set the latest date as the default selected date
        if (uniqueDates.length > 0) {
          setSelectedDate(new Date(uniqueDates[0]));
        }
        // Set USD as the default currency if available
        if (uniqueCurrencies.includes('usd')) {
          setSelectedCurrency('usd');
        } else if (uniqueCurrencies.length > 0) {
          setSelectedCurrency(uniqueCurrencies[0]);
        }

        console.log("Unique Dates:", uniqueDates);
        console.log("Unique Currencies:", uniqueCurrencies);
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
        <label>Select Date: </label>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          dateFormat="yyyy-MM-dd"
          placeholderText="Select a date"
          filterDate={(date) => availableDates.includes(date.toISOString().split('T')[0])}
        />
      </div>

      <div className="currency-select">
        <label>Select Currency: </label>
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
            1 BTC = {getCurrentRate()?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedCurrency.toUpperCase()} (on{' '}
            {selectedDate ? selectedDate.toISOString().split('T')[0] : 'N/A'})
          </h3>
        </div>
      )}

      {/* Pass the selectedCurrency and setSelectedCurrency to BtcChart */}
      <BtcChart
        availableCurrencies={availableCurrencies}
        selectedCurrency={selectedCurrency}
        setSelectedCurrency={setSelectedCurrency}
      />
    </div>
  );
};

export default CurrencyExchange;