import { useEffect, useState } from "react";
import { useLanguage } from "../../../i18n";
import useTransfer from "../hooks/useTransfer";
import AssignmentCard from "./AssignmentCard";
import DispatcherActionsCard from "./DispatcherActionsCard";
import DocumentsCard from "./DocumentsCard";
import DriverCard from "./DriverCard";
import FlightCard from "./FlightCard";
import NotesCard from "./NotesCard";
import OperationStatusCard from "./OperationStatusCard";
import PassengerCard from "./PassengerCard";
import VehicleCard from "./VehicleCard";
import "./control-tower-v6.css";

const translations = {
  tr: { assignment: "Atama", status: "Durum", contact: "İletişim", details: "Detay", documents: "Belgeler", passenger: "Yolcu", flight: "Uçuş", driver: "Sürücü", vehicle: "Araç", supplier: "Tedarikçi", passengers: "Kişi", route: "Güzergâh", expand: "Ayrıntılı bilgileri göster", collapse: "Ayrıntılı bilgileri gizle", evidence: "Mevcut belge görünümü" },
  en: { assignment: "Assignment", status: "Status", contact: "Contact", details: "Details", documents: "Documents", passenger: "Passenger", flight: "Flight", driver: "Driver", vehicle: "Vehicle", supplier: "Supplier", passengers: "Passengers", route: "Route", expand: "Show full details", collapse: "Hide full details", evidence: "Existing documents view" },
};
const textValue = (value) => value === undefined || value === null || value === "" ? "—" : String(value);

export default function TransferDetail() {
  const { selectedTransfer } = useTransfer();
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const [activeSection, setActiveSection] = useState("assignment");
  const [expanded, setExpanded] = useState(false);
  useEffect(() => { setExpanded(false); }, [selectedTransfer?.id]);
  if (!selectedTransfer) return null;
  const transfer = selectedTransfer;
  const driver = transfer.driver;
  const vehicle = driver?.vehicle;
  const rows = [
    [t.passenger, transfer.passenger_name],
    [t.flight, transfer.flight_number],
    [t.driver, driver?.name],
    [t.vehicle, vehicle ? `${vehicle.brand || ""} ${vehicle.model || ""} · ${vehicle.plate || ""}`.trim() : null],
    [t.supplier, transfer.supplier?.company_name || transfer.supplier?.name],
    [t.passengers, [transfer.adult, transfer.child, transfer.baby].some((v) => v !== undefined && v !== null) ? Number(transfer.adult || 0) + Number(transfer.child || 0) + Number(transfer.baby || 0) : null],
  ];
  const sections = ["assignment", "status", "contact", "details", "documents"];
  return (
    <section className="sf-v6" aria-label="Transfer operations">
      <div className="sf-v6-tabs" role="tablist" aria-label="Transfer işlem bölümleri">
        {sections.map((id) => (
          <button key={id} type="button" role="tab" id={`sf-v6-tab-${id}`} aria-selected={activeSection === id} aria-controls={`sf-v6-panel-${id}`} onClick={() => setActiveSection(id)}>{t[id]}</button>
        ))}
      </div>
      <div className="sf-v6-body" role="tabpanel" id={`sf-v6-panel-${activeSection}`} aria-labelledby={`sf-v6-tab-${activeSection}`}>
        {activeSection === "assignment" && <AssignmentCard />}
        {activeSection === "status" && <OperationStatusCard />}
        {activeSection === "contact" && <div className="sf-v6-contact"><DispatcherActionsCard /><details className="sf-v6-expand"><summary>{t.passenger}</summary><PassengerCard /></details></div>}
        {activeSection === "details" && <>
          <div className="sf-v6-summary">{rows.map(([label, value]) => <div key={label}><span>{label}</span><strong title={textValue(value)}>{textValue(value)}</strong></div>)}</div>
          <button className="sf-v6-expand-button" type="button" aria-expanded={expanded} onClick={() => setExpanded((prev) => !prev)}>{expanded ? t.collapse : t.expand} <span aria-hidden="true">{expanded ? "▴" : "▾"}</span></button>
          {expanded && <div className="sf-v6-full"><DriverCard /><VehicleCard /><FlightCard /><NotesCard /></div>}
        </>}
        {activeSection === "documents" && <div className="sf-v6-documents"><DocumentsCard /></div>}
      </div>
    </section>
  );
}
