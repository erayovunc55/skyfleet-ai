import { useEffect, useMemo, useState } from "react";

import CreateDriverModal from "../components/CreateDriverModal";
import { useLanguage } from "../i18n";
import { assignVehicleToDriver, getDrivers } from "../services/driverService";
import { getVehicles } from "../services/vehicleService";

const PAGE_SIZE_OPTIONS = [20, 50, 100];

const TEXT = {
  tr: {
    eyebrow: "SÜRÜCÜ OPERASYONU", title: "Sürücü Kontrol Merkezi",
    subtitle: "Sürücüleri, araç atamalarını ve tedarikçi bağlantılarını tek ekrandan yönetin.",
    add: "+ Sürücü Ekle", refresh: "Yenile", loading: "Yükleniyor...",
    total: "Toplam Sürücü", active: "Aktif Sürücü", assigned: "Araç Atanmış", waiting: "Araç Bekleyen",
    inventory: "SÜRÜCÜ ENVANTERİ", drivers: "Sürücüler", search: "Ad, telefon, e-posta, plaka veya tedarikçi ara...",
    allStatuses: "Tüm durumlar", activeOnly: "Aktif", passiveOnly: "Pasif", allAssignments: "Tüm atamalar", assignedOnly: "Araç atanmış", unassignedOnly: "Araç bekleyen",
    driver: "Sürücü", contact: "İletişim", supplier: "Tedarikçi", status: "Durum", vehicle: "Araç", assignment: "Araç Ataması", actions: "İşlem",
    activeState: "Aktif", passiveState: "Pasif", noVehicle: "Araç yok", noPhone: "Telefon yok", noEmail: "E-posta yok", internal: "Skyfleet / Dahili", edit: "Düzenle",
    showing: "Gösterilen", of: "/", page: "Sayfa", previous: "Önceki", next: "Sonraki", perPage: "sayfa başına",
    empty: "Filtrelere uyan sürücü bulunamadı.", loadError: "Sürücüler yüklenemedi.", assignError: "Araç ataması kaydedilemedi.", assignedMessage: "Araç sürücüye atandı.", removedMessage: "Sürücünün araç ataması kaldırıldı.", created: "Sürücü başarıyla oluşturuldu.", updated: "Sürücü bilgileri güncellendi.",
  },
  en: {
    eyebrow: "DRIVER OPERATIONS", title: "Driver Control Center",
    subtitle: "Manage drivers, vehicle assignments and supplier ownership from one scalable workspace.",
    add: "+ Add Driver", refresh: "Refresh", loading: "Loading...",
    total: "Total Drivers", active: "Active Drivers", assigned: "Vehicle Assigned", waiting: "Awaiting Vehicle",
    inventory: "DRIVER INVENTORY", drivers: "Drivers", search: "Search name, phone, email, plate or supplier...",
    allStatuses: "All statuses", activeOnly: "Active", passiveOnly: "Inactive", allAssignments: "All assignments", assignedOnly: "Vehicle assigned", unassignedOnly: "Awaiting vehicle",
    driver: "Driver", contact: "Contact", supplier: "Supplier", status: "Status", vehicle: "Vehicle", assignment: "Vehicle Assignment", actions: "Actions",
    activeState: "Active", passiveState: "Inactive", noVehicle: "No vehicle", noPhone: "No phone", noEmail: "No email", internal: "Skyfleet / Internal", edit: "Edit",
    showing: "Showing", of: "of", page: "Page", previous: "Previous", next: "Next", perPage: "per page",
    empty: "No drivers match these filters.", loadError: "Drivers could not be loaded.", assignError: "Vehicle assignment could not be saved.", assignedMessage: "Vehicle assigned to driver.", removedMessage: "Driver vehicle assignment removed.", created: "Driver created successfully.", updated: "Driver information updated.",
  },
  ar: {
    eyebrow: "عمليات السائقين", title: "مركز التحكم بالسائقين", subtitle: "إدارة السائقين وتعيينات المركبات والموردين من مساحة عمل واحدة قابلة للتوسع.",
    add: "+ إضافة سائق", refresh: "تحديث", loading: "جارٍ التحميل...",
    total: "إجمالي السائقين", active: "السائقون النشطون", assigned: "مركبة معينة", waiting: "بانتظار مركبة",
    inventory: "مخزون السائقين", drivers: "السائقون", search: "ابحث بالاسم أو الهاتف أو البريد أو اللوحة أو المورد...",
    allStatuses: "كل الحالات", activeOnly: "نشط", passiveOnly: "غير نشط", allAssignments: "كل التعيينات", assignedOnly: "مركبة معينة", unassignedOnly: "بانتظار مركبة",
    driver: "السائق", contact: "الاتصال", supplier: "المورد", status: "الحالة", vehicle: "المركبة", assignment: "تعيين المركبة", actions: "الإجراءات",
    activeState: "نشط", passiveState: "غير نشط", noVehicle: "بدون مركبة", noPhone: "لا يوجد هاتف", noEmail: "لا يوجد بريد", internal: "Skyfleet / داخلي", edit: "تعديل",
    showing: "عرض", of: "من", page: "صفحة", previous: "السابق", next: "التالي", perPage: "لكل صفحة",
    empty: "لا يوجد سائقون مطابقون للفلاتر.", loadError: "تعذر تحميل السائقين.", assignError: "تعذر حفظ تعيين المركبة.", assignedMessage: "تم تعيين المركبة للسائق.", removedMessage: "تمت إزالة المركبة من السائق.", created: "تم إنشاء السائق بنجاح.", updated: "تم تحديث بيانات السائق.",
  },
  es: {
    eyebrow: "OPERACIONES DE CONDUCTORES", title: "Centro de Control de Conductores", subtitle: "Gestiona conductores, vehículos y proveedores desde un espacio escalable.",
    add: "+ Añadir Conductor", refresh: "Actualizar", loading: "Cargando...",
    total: "Conductores Totales", active: "Conductores Activos", assigned: "Vehículo Asignado", waiting: "Sin Vehículo",
    inventory: "INVENTARIO DE CONDUCTORES", drivers: "Conductores", search: "Buscar nombre, teléfono, correo, matrícula o proveedor...",
    allStatuses: "Todos los estados", activeOnly: "Activo", passiveOnly: "Inactivo", allAssignments: "Todas las asignaciones", assignedOnly: "Con vehículo", unassignedOnly: "Sin vehículo",
    driver: "Conductor", contact: "Contacto", supplier: "Proveedor", status: "Estado", vehicle: "Vehículo", assignment: "Asignación de Vehículo", actions: "Acciones",
    activeState: "Activo", passiveState: "Inactivo", noVehicle: "Sin vehículo", noPhone: "Sin teléfono", noEmail: "Sin correo", internal: "Skyfleet / Interno", edit: "Editar",
    showing: "Mostrando", of: "de", page: "Página", previous: "Anterior", next: "Siguiente", perPage: "por página",
    empty: "No hay conductores que coincidan con los filtros.", loadError: "No se pudieron cargar los conductores.", assignError: "No se pudo guardar la asignación del vehículo.", assignedMessage: "Vehículo asignado al conductor.", removedMessage: "Asignación de vehículo eliminada.", created: "Conductor creado correctamente.", updated: "Información del conductor actualizada.",
  },
};

export default function DriversPage() {
  const { language } = useLanguage();
  const text = TEXT[language] || TEXT.en;

  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [savingDriverId, setSavingDriverId] = useState(null);
  const [showCreateDriver, setShowCreateDriver] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [driverItems, vehicleItems] = await Promise.all([getDrivers(), getVehicles()]);
      setDrivers(Array.isArray(driverItems) ? driverItems : []);
      setVehicles(Array.isArray(vehicleItems) ? vehicleItems : []);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || text.loadError);
    } finally {
      setLoading(false);
    }
  }

  async function handleVehicleChange(driver, value) {
    setSavingDriverId(driver.id);
    setError("");
    setMessage("");
    try {
      await assignVehicleToDriver(driver.id, value ? Number(value) : null);
      await loadData();
      setMessage(value ? text.assignedMessage : text.removedMessage);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || text.assignError);
    } finally {
      setSavingDriverId(null);
    }
  }

  const stats = useMemo(() => {
    const assigned = drivers.filter((driver) => driver.vehicle_id || driver.vehicle).length;
    return {
      total: drivers.length,
      active: drivers.filter((driver) => driver.is_active).length,
      assigned,
      waiting: Math.max(drivers.length - assigned, 0),
    };
  }, [drivers]);

  const filteredDrivers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return drivers.filter((driver) => {
      const hasVehicle = Boolean(driver.vehicle_id || driver.vehicle);
      if (statusFilter === "active" && !driver.is_active) return false;
      if (statusFilter === "inactive" && driver.is_active) return false;
      if (assignmentFilter === "assigned" && !hasVehicle) return false;
      if (assignmentFilter === "unassigned" && hasVehicle) return false;
      if (!query) return true;
      return [
        driver.name,
        driver.phone,
        driver.email,
        driver.vehicle?.plate,
        driver.vehicle_plate,
        getSupplierLabel(driver),
      ].filter(Boolean).join(" ").toLocaleLowerCase().includes(query);
    });
  }, [drivers, search, statusFilter, assignmentFilter]);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, assignmentFilter, pageSize]);
  const totalPages = Math.max(1, Math.ceil(filteredDrivers.length / pageSize));
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);

  const paginatedDrivers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDrivers.slice(start, start + pageSize);
  }, [filteredDrivers, currentPage, pageSize]);

  const firstVisible = filteredDrivers.length ? (currentPage - 1) * pageSize + 1 : 0;
  const lastVisible = Math.min(currentPage * pageSize, filteredDrivers.length);

  return (
    <main className="drivers-page drivers-control-center">
      <header className="drivers-page-header drivers-control-header">
        <div>
          <span className="drivers-eyebrow">{text.eyebrow}</span>
          <h1>{text.title}</h1>
          <p>{text.subtitle}</p>
        </div>
        <div className="drivers-header-actions">
          <button className="drivers-create-button" type="button" onClick={() => { setEditingDriver(null); setShowCreateDriver(true); }}>{text.add}</button>
          <button type="button" disabled={loading} onClick={loadData}>{loading ? text.loading : `↻ ${text.refresh}`}</button>
        </div>
      </header>

      <section className="drivers-summary-grid">
        <DriverKpi icon="👥" label={text.total} value={stats.total} tone="blue" />
        <DriverKpi icon="✓" label={text.active} value={stats.active} tone="green" />
        <DriverKpi icon="🚐" label={text.assigned} value={stats.assigned} tone="cyan" />
        <DriverKpi icon="◌" label={text.waiting} value={stats.waiting} tone="purple" />
      </section>

      <section className="drivers-content-card drivers-table-card">
        <div className="drivers-table-heading">
          <div><span>{text.inventory}</span><h2>{text.drivers}</h2></div>
          <strong>{filteredDrivers.length}</strong>
        </div>

        <div className="drivers-toolbar drivers-scale-toolbar">
          <input type="search" value={search} placeholder={text.search} onChange={(event) => setSearch(event.target.value)} />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">{text.allStatuses}</option>
            <option value="active">{text.activeOnly}</option>
            <option value="inactive">{text.passiveOnly}</option>
          </select>
          <select value={assignmentFilter} onChange={(event) => setAssignmentFilter(event.target.value)}>
            <option value="all">{text.allAssignments}</option>
            <option value="assigned">{text.assignedOnly}</option>
            <option value="unassigned">{text.unassignedOnly}</option>
          </select>
        </div>

        {error && <div className="drivers-message error">{error}</div>}
        {message && <div className="drivers-message success">{message}</div>}
        {loading && <div className="drivers-empty-state">{text.loading}</div>}

        {!loading && (
          <div className="drivers-table-wrapper">
            <table className="drivers-table drivers-professional-table">
              <thead><tr><th>{text.driver}</th><th>{text.contact}</th><th>{text.supplier}</th><th>{text.status}</th><th>{text.vehicle}</th><th>{text.assignment}</th><th>{text.actions}</th></tr></thead>
              <tbody>
                {paginatedDrivers.map((driver) => (
                  <tr key={driver.id}>
                    <td><div className="driver-identity"><span>{getInitials(driver.name)}</span><div><strong>{driver.name || "—"}</strong><small>ID #{driver.id}</small></div></div></td>
                    <td><div className="driver-contact"><span>{driver.phone || text.noPhone}</span><small>{driver.email || text.noEmail}</small></div></td>
                    <td><div className="driver-supplier"><strong>{getSupplierLabel(driver) || text.internal}</strong>{driver.supplier_company?.city && <small>{driver.supplier_company.city}</small>}</div></td>
                    <td><span className={driver.is_active ? "driver-state active" : "driver-state passive"}>{driver.is_active ? text.activeState : text.passiveState}</span></td>
                    <td>{driver.vehicle ? <div className="driver-vehicle"><strong>{getVehiclePlate(driver.vehicle)}</strong><small>{getVehicleName(driver.vehicle)}</small></div> : <span className="driver-no-vehicle">{text.noVehicle}</span>}</td>
                    <td><select className="driver-assignment-select" value={driver.vehicle_id || driver.vehicle?.id || ""} disabled={savingDriverId === driver.id} onChange={(event) => handleVehicleChange(driver, event.target.value)}><option value="">{text.noVehicle}</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id} disabled={!vehicle.is_active || vehicle.operational_status === "inactive"}>{getVehiclePlate(vehicle)} — {getVehicleName(vehicle)}</option>)}</select></td>
                    <td><button className="driver-edit-button" type="button" onClick={() => { setShowCreateDriver(false); setEditingDriver(driver); }}>{text.edit}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!paginatedDrivers.length && <div className="drivers-empty-state">{text.empty}</div>}
          </div>
        )}

        <div className="drivers-pagination">
          <div>{text.showing} <strong>{firstVisible}-{lastVisible}</strong> {text.of} <strong>{filteredDrivers.length}</strong></div>
          <div className="drivers-page-controls"><button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>‹ {text.previous}</button><span>{text.page} <strong>{currentPage}</strong> / {totalPages}</span><button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>{text.next} ›</button></div>
          <label><select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>{PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}</select><span>{text.perPage}</span></label>
        </div>
      </section>

      {(showCreateDriver || editingDriver) && (
        <CreateDriverModal
          driver={editingDriver}
          vehicles={vehicles}
          onClose={() => { setShowCreateDriver(false); setEditingDriver(null); }}
          onSaved={async () => {
            const wasEditing = Boolean(editingDriver);
            setShowCreateDriver(false);
            setEditingDriver(null);
            await loadData();
            setMessage(wasEditing ? text.updated : text.created);
          }}
        />
      )}
    </main>
  );
}

function DriverKpi({ icon, label, value, tone }) {
  return <article className={`drivers-kpi drivers-kpi-${tone}`}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></article>;
}

function getInitials(name) {
  return String(name || "SF").trim().split(/\s+/).map((part) => part.charAt(0)).join("").slice(0, 2).toUpperCase();
}

function getVehiclePlate(vehicle) {
  return vehicle?.plate || vehicle?.license_plate || vehicle?.vehicle_plate || "—";
}

function getVehicleName(vehicle) {
  return [vehicle?.brand, vehicle?.model].filter(Boolean).join(" ") || "—";
}

function getSupplierLabel(driver) {
  return driver?.supplier_company?.company_name
    || driver?.supplierCompany?.company_name
    || driver?.supplier?.company_name
    || driver?.supplier_name
    || (typeof driver?.supplier === "string" ? driver.supplier : "")
    || "";
}
