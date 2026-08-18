import { useEffect, useRef, useState } from "react";
import { searchAirports } from "../../services/locationService";

const COPY = {
  en: { label: "Airport Finder", placeholder: "Type country, city, airport name, IATA or ICAO...", hint: "Search the airport master and auto-fill location data.", no: "No matching airports found.", loading: "Searching airports..." },
  tr: { label: "Havalimanı Bulucu", placeholder: "Ülke, şehir, havalimanı adı, IATA veya ICAO yazın...", hint: "Havalimanı ana verisinde arayın ve lokasyon bilgilerini otomatik doldurun.", no: "Eşleşen havalimanı bulunamadı.", loading: "Havalimanları aranıyor..." },
  ar: { label: "البحث عن المطار", placeholder: "اكتب الدولة أو المدينة أو اسم المطار أو IATA أو ICAO...", hint: "ابحث في بيانات المطارات واملأ معلومات الموقع تلقائياً.", no: "لم يتم العثور على مطارات مطابقة.", loading: "جارٍ البحث عن المطارات..." },
  es: { label: "Buscador de Aeropuertos", placeholder: "Escriba país, ciudad, aeropuerto, IATA o ICAO...", hint: "Busque en el maestro de aeropuertos y complete los datos automáticamente.", no: "No se encontraron aeropuertos.", loading: "Buscando aeropuertos..." },
};

export default function AirportFinder({ language = "en", onSelect }) {
  const text = COPY[language] || COPY.en;
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const requestRef = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setRows([]); setOpen(false); return; }
    const timer = setTimeout(async () => {
      const requestId = ++requestRef.current;
      setLoading(true); setOpen(true);
      try {
        const data = await searchAirports(q);
        if (requestId === requestRef.current) setRows(data);
      } catch {
        if (requestId === requestRef.current) setRows([]);
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    }, 260);
    return () => clearTimeout(timer);
  }, [query]);

  function choose(airport) {
    setQuery(`${airport.iata_code || airport.icao_code || ""} — ${airport.name}`);
    setOpen(false);
    onSelect?.(airport);
  }

  return <div className="airport-finder">
    <label>{text.label}</label>
    <div className="airport-finder-input"><span>✈</span><input value={query} onChange={(e)=>setQuery(e.target.value)} onFocus={()=>query.trim().length>=2&&setOpen(true)} placeholder={text.placeholder}/></div>
    <small>{text.hint}</small>
    {open && <div className="airport-finder-results">
      {loading ? <div className="airport-finder-state">{text.loading}</div> : rows.length ? rows.map((airport)=><button type="button" key={airport.id} onClick={()=>choose(airport)}>
        <div className="airport-result-code"><strong>{airport.iata_code || "—"}</strong><span>{airport.icao_code || "—"}</span></div>
        <div className="airport-result-main"><strong>{airport.name}</strong><span>{airport.city?.name || "—"}, {airport.country?.name || "—"}</span></div>
        <span className="airport-result-arrow">→</span>
      </button>) : <div className="airport-finder-state">{text.no}</div>}
    </div>}
  </div>;
}
