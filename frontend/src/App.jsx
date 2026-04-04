import { useState } from "react";
import axios from "axios";

function App() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState("");

  function searchDoctors() {
    axios
      .get("http://localhost:8500/rest/api/doctors/search", {
        params: { search_query: search }
      })
      .then((response) => {
        setResults(JSON.stringify(response.data, null, 2));
      })
      .catch((error) => {
        console.log(error);
      });
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>Search Doctors</h1>

      <input
        type="text"
        placeholder="Search doctor"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <button onClick={searchDoctors}>Search</button>

      <pre>{results}</pre>
    </div>
  );
}

export default App;