import React, { useState } from "react";
import axios from "axios";
import "./App.css";
import { Calendar } from "react-multi-date-picker";

function App() {
  const [dates, setDates] = useState([]);
  return (
    <div className="App">
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Calendar
          multiple
          onChange={(selectedDates) => {
            const datesFormattedForTimeSheet = selectedDates.map((dateObj) => {
              return `${dateObj.day}/${dateObj.month}/${dateObj.year}`;
            });
            setDates(datesFormattedForTimeSheet);
          }}
        />
      </div>
      <button
        onClick={() => {
          axios.post("/update", dates).then((data) => {
            console.log("timesheet updated: ", data);
          });
        }}
      >
        Update timesheet for selected dates
      </button>
    </div>
  );
}

export default App;
