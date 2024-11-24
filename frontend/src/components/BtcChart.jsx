

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
import './BtcChart.css';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const BtcChart = ({ availableCurrencies, selectedCurrency, setSelectedCurrency }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLast30DaysData = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get('http://18.142.218.90:3000/api/currency-data');
      
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
            borderColor: 'rgba(0, 21, 255, 0.5)',
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
            maintainAspectRatio: false, // ปิดการปรับขนาดอัตโนมัติ
            responsive: true,
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Dates',
                  color: '#000', // สีดำสำหรับหัวข้อแกน X
                },
                ticks: {
                  maxRotation: 0, // หมุนข้อความแกน X
                  autoSkip: true,
                  maxTicksLimit: 7,
                  color: '#000',
                },
              },
              y: {
                title: {
                  display: true,
                  text: `BTC to ${selectedCurrency.toUpperCase()}`,
                  color: '#000', 
                },
                ticks: {
                  beginAtZero: true,
                  color: '#000', 
                },
              },
            },
            plugins: {
              legend: {
                position: 'top',
              },
              tooltip: {
                callbacks: {
                  label: function (tooltipItem) {
                    // ดึงวันที่จากแกน X และจัดการให้ไม่มี "T"
                    const rawDate = tooltipItem.label;
                    const formattedDate = new Date(rawDate).toISOString().slice(0, 10); // ตัดให้เหลือ yyyy-mm-dd
                    const rate = tooltipItem.raw; // ค่าของ BTC
                    return `Date: ${formattedDate} | Rate: ${rate}`;
                  },
                  title: function () {
                    // ไม่แสดงหัวข้อใน tooltip
                    return '';
                  },
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