import { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const BtcChart = ({ availableCurrencies, selectedCurrency, setSelectedCurrency }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLast30DaysData = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get('http://13.214.66.96:3000/api/currency-data');
      
      const filteredData = data
        .filter(entry => entry.currency === selectedCurrency)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-30);

      const dates = filteredData.map(entry => entry.date);
      const rates = filteredData.map(entry => entry.btc || 0);

      setChartData({
        labels: dates,
        datasets: [
          {
            label: `BTC to ${selectedCurrency.toUpperCase()} (Last 30 Days)`,
            data: rates,
            borderColor: 'rgba(75,192,192,1)',
            backgroundColor: 'rgba(75,192,192,0.2)',
            tension: 0.4,
            fill: true,
          },
        ],
      });
    } catch (err) {
      console.error('Failed to fetch last 30 days data', err);
      setError('Failed to fetch last 30 days data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCurrency) {
      fetchLast30DaysData();
    }
  }, [selectedCurrency]);

  if (loading) return <p>Loading chart...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="chart-container">
      <h2>BTC Exchange Rate (Last 30 Days)</h2>
      {chartData ? (
        <Line
          data={chartData}
          options={{
            scales: {
              x: {
                display: false, // Hide x-axis labels
              },
              y: {
                title: {
                  display: true,
                  text: `BTC to ${selectedCurrency.toUpperCase()}`,
                },
              },
            },
          }}
        />
      ) : (
        <p>No chart data available.</p>
      )}
    </div>
  );
};

export default BtcChart;