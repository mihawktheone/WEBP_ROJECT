// src/App.jsx
import './App.css';
import CurrencyExchange from './components/CurrencyExchange';
import { useState } from 'react';


function App() {
 const [availableCurrencies, setAvailableCurrencies] = useState([]);
 const [selectedCurrency, setSelectedCurrency] = useState('usd'); // สกุลเงินเริ่มต้น


 return (
   <div className="App">
     <CurrencyExchange
       availableCurrencies={availableCurrencies}
       selectedCurrency={selectedCurrency}
       setSelectedCurrency={setSelectedCurrency}
     />


   </div>
 );
}


export default App;

