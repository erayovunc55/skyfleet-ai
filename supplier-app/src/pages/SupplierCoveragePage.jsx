import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  MapContainer,
  Marker,
  Polygon,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

import { useLanguage } from "../i18n";

import {
  createSupplierCoverage,
  deleteSupplierCoverage,
  getSupplierCoverages,
  searchAirports,
  updateSupplierCoverage,
} from "../services/supplierService";

const DEFAULT_CENTER = [
  41.0082,
  28.9784,
];

const EMPTY_FORM = {
  airport_id: "",
  label: "",
  service_radius_meters: "1500",
  coverage_type: "airport",
  base_price: "",
  currency: "EUR",
  vehicle_prices: {
    pickup: {},
    dropoff: {},
  },
  pickup_enabled: true,
  dropoff_enabled: true,
  is_active: true,
};

const VEHICLE_TYPES = [
  {
    key: "standard_car",
    icon: "🚘",
  },
  {
    key: "executive_car",
    icon: "💼",
  },
  {
    key: "luxury_car",
    icon: "⭐",
  },
  {
    key: "people_carrier",
    icon: "🚐",
  },
  {
    key: "executive_people_carrier",
    icon: "✨",
  },
  {
    key: "large_people_carrier",
    icon: "🚌",
  },
  {
    key: "minibus",
    icon: "🚍",
  },
];

const TEXT = {
  tr: {
    loadError:
      "Kapsama alanları yüklenemedi.",

    airportRequired:
      "Kapsama alanına eklemek için bir havalimanı seçin.",

    polygonPointsError:
      "Poligon için en az 3 nokta çizmelisiniz.",

    polygonNameError:
      "Poligon için bölge adı zorunludur.",

    polygonPriceError:
      "Poligon için taban fiyat zorunludur.",

    updated:
      "Kapsama alanı güncellendi.",

    created:
      "Kapsama alanı eklendi.",

    saveError:
      "Kapsama alanı kaydedilemedi.",

    updateError:
      "Kapsama alanı güncellenemedi.",

    deleteFallback:
      "Bu kapsama alanı",

    deleteConfirmSuffix:
      "silinsin mi?",

    deleted:
      "Kapsama alanı kaldırıldı.",

    deleteError:
      "Kapsama alanı silinemedi.",

    eyebrow:
      "OPERASYON AĞI",

    title:
      "Kapsama Alanları",

    description:
      "Hizmet verdiğiniz havalimanlarını ve poligon bölgelerinizi yönetin.",

    refresh:
      "Yenile",

    addAirport:
      "+ Kapsama Alanı Ekle",

    totalAreas:
      "Toplam Bölge",

    active:
      "Aktif",

    pickup:
      "Alış",

    dropoff:
      "Dropoff",

    servicePoints:
      "Hizmet Noktaları",

    records:
      "kayıt",

    loading:
      "Kapsama alanları yükleniyor...",

    emptyTitle:
      "Henüz kapsama alanı eklenmedi",

    emptyDescription:
      "İlk havalimanınızı veya poligon bölgenizi ekleyerek operasyon ağınızı oluşturmaya başlayın.",

    airport:
      "Havalimanı",

    polygon:
      "Poligon",

    location:
      "Konum",

    notSpecified:
      "Belirtilmedi",

    serviceRadius:
      "Servis yarıçapı",

    status:
      "Durum",

    inactive:
      "Pasif",

    edit:
      "Düzenle",

    delete:
      "Sil",

    editAria:
      "Kapsama alanını düzenle",

    addAria:
      "Kapsama alanı ekle",

    coverageArea:
      "KAPSAMA ALANI",

    editCoverage:
      "Kapsama Alanını Düzenle",

    addNewAirport:
      "Yeni Kapsama Alanı",

    searchAirport:
      "Havalimanı ara",

    searchPlaceholder:
      "IST, AYT, Barcelona, Madrid...",

    searchingAirports:
      "Havalimanları aranıyor...",

    displayName:
      "Bölge / Görünen ad",

    displayNamePlaceholder:
      "Örn. İstanbul Havalimanı - Avrupa Yakası",

    serviceRadiusMeters:
      "Servis yarıçapı (metre)",

    pickupService:
      "Pickup hizmeti",

    dropoffService:
      "Dropoff hizmeti",

    coverageActive:
      "Kapsama alanı aktif",

    polygonTitle:
      "Poligon Hizmet Alanı",

    polygonDescription:
      "Harita üzerine tıklayarak hizmet verdiğiniz bölgenin sınırlarını çizin.",

    polygonOptional:
      "Poligon çizmezseniz standart havalimanı kapsama alanı olarak kaydedilir.",

    undoPoint:
      "Son Noktayı Geri Al",

    clearPolygon:
      "Poligonu Temizle",

    point:
      "nokta",

    polygonReady:
      "Poligon hazır",

    basePrice:
      "Taban fiyat",

    currency:
      "Para birimi",

    vehiclePrices:
      "Araç Fiyatları",

    pickupPrices:
      "Pickup Fiyatları",

    dropoffPrices:
      "Dropoff Fiyatları",

    standardCar:
  "Standard Car",

executiveCar:
  "Executive",

luxuryCar:
  "Luxury",

peopleCarrier:
  "People Carrier",

executivePeopleCarrier:
  "Executive People Carrier",

largePeopleCarrier:
  "Large People Carrier",

minibus:
  "Minibus",

   

    perTransfer:
      "transfer başına",

    cancel:
      "Vazgeç",

    saving:
      "Kaydediliyor...",

    saveChanges:
      "Değişiklikleri Kaydet",

    addAirportAction:
      "Kapsama Alanını Kaydet",

    zones:
      "Bölgeler",

    standardCoverage:
      "Standart havalimanı kapsaması",
  },

  en: {
    loadError:
      "Coverage areas could not be loaded.",

    airportRequired:
      "Select an airport to add to your coverage area.",

    polygonPointsError:
      "Draw at least 3 points for a polygon.",

    polygonNameError:
      "Zone name is required for a polygon.",

    polygonPriceError:
      "Base price is required for a polygon.",

    updated:
      "Coverage area updated.",

    created:
      "Coverage area added.",

    saveError:
      "Coverage area could not be saved.",

    updateError:
      "Coverage area could not be updated.",

    deleteFallback:
      "This coverage area",

    deleteConfirmSuffix:
      "will be deleted. Continue?",

    deleted:
      "Coverage area removed.",

    deleteError:
      "Coverage area could not be deleted.",

    eyebrow:
      "OPERATION NETWORK",

    title:
      "Coverage Areas",

    description:
      "Manage the airports and polygon areas where you provide service.",

    refresh:
      "Refresh",

    addAirport:
      "+ Add Coverage",

    totalAreas:
      "Total Areas",

    active:
      "Active",

    pickup:
      "Pickup",

    dropoff:
      "Dropoff",

    servicePoints:
      "Service Points",

    records:
      "records",

    loading:
      "Loading coverage areas...",

    emptyTitle:
      "No coverage areas added yet",

    emptyDescription:
      "Add your first airport or polygon area to start building your operation network.",

    airport:
      "Airport",

    polygon:
      "Polygon",

    location:
      "Location",

    notSpecified:
      "Not specified",

    serviceRadius:
      "Service Radius",

    status:
      "Status",

    inactive:
      "Inactive",

    edit:
      "Edit",

    delete:
      "Delete",

    editAria:
      "Edit coverage area",

    addAria:
      "Add coverage area",

    coverageArea:
      "COVERAGE AREA",

    editCoverage:
      "Edit Coverage Area",

    addNewAirport:
      "New Coverage Area",

    searchAirport:
      "Search airport",

    searchPlaceholder:
      "IST, AYT, Barcelona, Madrid...",

    searchingAirports:
      "Searching airports...",

    displayName:
      "Zone / Display Name",

    displayNamePlaceholder:
      "E.g. Istanbul Airport - European Side",

    serviceRadiusMeters:
      "Service Radius (meters)",

    pickupService:
      "Pickup service",

    dropoffService:
      "Dropoff service",

    coverageActive:
      "Coverage area active",

    polygonTitle:
      "Polygon Service Area",

    polygonDescription:
      "Click on the map to draw the boundary of your service area.",

    polygonOptional:
      "If you do not draw a polygon, it will be saved as standard airport coverage.",

    undoPoint:
      "Undo Last Point",

    clearPolygon:
      "Clear Polygon",

    point:
      "points",

    polygonReady:
      "Polygon ready",

    basePrice:
      "Base price",

    currency:
      "Currency",

    vehiclePrices:
      "Vehicle Prices",

    pickupPrices:
      "Pickup Prices",

    dropoffPrices:
      "Dropoff Prices",

    standardCar:
      "Standard Car",

    peopleCarrier:
      "People Carrier",

    largePeopleCarrier:
      "Large People Carrier",

    executivePeopleCarrier:
      "Executive People Carrier",

    perTransfer:
      "per transfer",

    cancel:
      "Cancel",

    saving:
      "Saving...",

    saveChanges:
      "Save Changes",

    addAirportAction:
      "Save Coverage",

    zones:
      "Zones",

    standardCoverage:
      "Standard airport coverage",
  },
};

TEXT.es = {
  ...TEXT.en,

  title:
    "Áreas de Cobertura",

  addAirport:
    "+ Añadir Cobertura",

  refresh:
    "Actualizar",

  pickup:
    "Recogida",

  dropoff:
    "Destino",

  active:
    "Activo",

  inactive:
    "Inactivo",

  edit:
    "Editar",

  delete:
    "Eliminar",

  cancel:
    "Cancelar",

  polygon:
    "Polígono",

  polygonTitle:
    "Área de Servicio Poligonal",

  polygonReady:
    "Polígono listo",

  zones:
    "Zonas",
};

TEXT.ar = {
  ...TEXT.en,

  title:
    "مناطق التغطية",

  addAirport:
    "+ إضافة نطاق",

  refresh:
    "تحديث",

  pickup:
    "استلام",

  dropoff:
    "توصيل",

  active:
    "نشط",

  inactive:
    "غير نشط",

  edit:
    "تعديل",

  delete:
    "حذف",

  cancel:
    "إلغاء",

  polygon:
    "منطقة",

  polygonReady:
    "المنطقة جاهزة",

  zones:
    "المناطق",
};

export default function SupplierCoveragePage() {
  const { language } =
    useLanguage();

  const t =
    TEXT[language] ||
    TEXT.en;

  const [
    coverages,
    setCoverages,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    editingCoverage,
    setEditingCoverage,
  ] = useState(null);

  const [
    form,
    setForm,
  ] = useState(
    EMPTY_FORM,
  );

  const [
    airportQuery,
    setAirportQuery,
  ] = useState("");

  const [
    airportResults,
    setAirportResults,
  ] = useState([]);

  const [
    airportSearching,
    setAirportSearching,
  ] = useState(false);

  const [
    selectedAirport,
    setSelectedAirport,
  ] = useState(null);

  const [
    polygonPoints,
    setPolygonPoints,
  ] = useState([]);

  const [
    priceMode,
    setPriceMode,
  ] = useState(
    "pickup",
  );

  const loadCoverages =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const data =
            await getSupplierCoverages();

          setCoverages(data);
        } catch (
          requestError
        ) {
          setError(
            getErrorMessage(
              requestError,
              t.loadError,
            ),
          );
        } finally {
          setLoading(false);
        }
      },
      [t.loadError],
    );

  useEffect(() => {
    loadCoverages();
  }, [loadCoverages]);

  useEffect(() => {
    if (
      !showForm ||
      editingCoverage
    ) {
      return;
    }

    const q =
      airportQuery.trim();

    if (q.length < 2) {
      setAirportResults([]);
      setAirportSearching(
        false,
      );

      return;
    }

    const timer =
      window.setTimeout(
        async () => {
          setAirportSearching(
            true,
          );

          try {
            const results =
              await searchAirports(
                q,
                12,
              );

            setAirportResults(
              results,
            );
          } catch {
            setAirportResults(
              [],
            );
          } finally {
            setAirportSearching(
              false,
            );
          }
        },
        300,
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    airportQuery,
    showForm,
    editingCoverage,
  ]);

  const summary =
    useMemo(
      () => ({
        total:
          coverages.length,

        active:
          coverages.filter(
            (coverage) =>
              coverage.is_active,
          ).length,

        pickup:
          coverages.filter(
            (coverage) =>
              coverage.is_active &&
              coverage.pickup_enabled,
          ).length,

        dropoff:
          coverages.filter(
            (coverage) =>
              coverage.is_active &&
              coverage.dropoff_enabled,
          ).length,
      }),
      [coverages],
    );

  const groupedCoverages =
    useMemo(
      () =>
        groupCoveragesByLocation(
          coverages,
        ),
      [coverages],
    );

  function openCreateForm() {
    setEditingCoverage(
      null,
    );

    setForm({
      ...EMPTY_FORM,

      vehicle_prices: {
        pickup: {},
        dropoff: {},
      },
    });

    setAirportQuery("");

    setAirportResults(
      [],
    );

    setSelectedAirport(
      null,
    );

    setPolygonPoints(
      [],
    );

    setPriceMode(
      "pickup",
    );

    setError("");
    setMessage("");

    setShowForm(true);
  }

  function openEditForm(
    coverage,
  ) {
    setEditingCoverage(
      coverage,
    );

    setForm({
      airport_id:
        coverage.location
          ?.airport_id ||
        "",

      label:
        coverage.label ||
        coverage.location
          ?.name ||
        "",

      service_radius_meters:
        String(
          coverage
            .service_radius_meters ||
            coverage.location
              ?.geofence_radius_meters ||
            1500,
        ),

      coverage_type:
        coverage
          .coverage_type ||
        "airport",

      base_price:
        coverage
          .base_price ??
        "",

      currency:
        coverage.currency ||
        "EUR",

      vehicle_prices:
        normalizeVehiclePrices(
          coverage.vehicle_prices,
        ),

      pickup_enabled:
        Boolean(
          coverage
            .pickup_enabled,
        ),

      dropoff_enabled:
        Boolean(
          coverage
            .dropoff_enabled,
        ),

      is_active:
        Boolean(
          coverage.is_active,
        ),
    });

    setPolygonPoints(
      normalizePolygon(
        coverage.polygon,
      ),
    );

    setSelectedAirport(
      coverage.location
        ? {
            id:
              coverage
                .location
                .airport_id,

            name:
              coverage
                .location
                .name,

            iata_code:
              coverage
                .location
                .code,

            latitude:
              coverage
                .location
                .latitude,

            longitude:
              coverage
                .location
                .longitude,

            city:
              coverage.city,

            country:
              coverage.country,
          }
        : null,
    );

    setAirportQuery(
      coverage.location
        ?.code ||
        coverage.location
          ?.name ||
        "",
    );

    setAirportResults(
      [],
    );

    setPriceMode(
      "pickup",
    );

    setError("");
    setMessage("");

    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);

    setEditingCoverage(
      null,
    );

    setForm({
      ...EMPTY_FORM,

      vehicle_prices: {
        pickup: {},
        dropoff: {},
      },
    });

    setAirportQuery("");

    setAirportResults(
      [],
    );

    setSelectedAirport(
      null,
    );

    setPolygonPoints(
      [],
    );

    setPriceMode(
      "pickup",
    );
  }

  function updateField(
    name,
    value,
  ) {
    setForm(
      (current) => ({
        ...current,
        [name]: value,
      }),
    );
  }

  function selectAirport(
    airport,
  ) {
    setSelectedAirport(
      airport,
    );

    setForm(
      (current) => ({
        ...current,

        airport_id:
          String(
            airport.id,
          ),

        label:
          current.label ||
          airport.name ||
          "",
      }),
    );

    setAirportQuery(
      [
        airport.iata_code,
        airport.name,
      ]
        .filter(Boolean)
        .join(" · "),
    );

    setAirportResults(
      [],
    );

    setPolygonPoints(
      [],
    );
  }

  function updateVehiclePrice(
    vehicleKey,
    value,
  ) {
    setForm(
      (current) => ({
        ...current,

        vehicle_prices: {
          ...current
            .vehicle_prices,

          [priceMode]: {
            ...current
              .vehicle_prices?.[
                priceMode
              ],

            [vehicleKey]:
              value,
          },
        },
      }),
    );
  }

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    if (
      !editingCoverage &&
      !form.airport_id
    ) {
      setError(
        t.airportRequired,
      );

      return;
    }

    const isPolygon =
      polygonPoints.length >=
      3;

    if (
      polygonPoints.length >
        0 &&
      polygonPoints.length < 3
    ) {
      setError(
        t.polygonPointsError,
      );

      return;
    }

    if (
      isPolygon &&
      !form.label.trim()
    ) {
      setError(
        t.polygonNameError,
      );

      return;
    }

    if (
      isPolygon &&
      form.base_price === ""
    ) {
      setError(
        t.polygonPriceError,
      );

      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      label:
        form.label.trim() ||
        null,

      service_radius_meters:
        form
          .service_radius_meters
          ? Number(
              form
                .service_radius_meters,
            )
          : null,

      pickup_enabled:
        Boolean(
          form.pickup_enabled,
        ),

      dropoff_enabled:
        Boolean(
          form.dropoff_enabled,
        ),

      is_active:
        Boolean(
          form.is_active,
        ),

      coverage_type:
        isPolygon
          ? "polygon"
          : "airport",

      polygon:
        isPolygon
          ? polygonPoints
          : null,

      base_price:
        form.base_price ===
        ""
          ? null
          : Number(
              form.base_price,
            ),

      currency:
        form.currency ||
        "EUR",

      vehicle_prices: {
        pickup:
          cleanPriceObject(
            form
              .vehicle_prices
              ?.pickup,
          ),

        dropoff:
          cleanPriceObject(
            form
              .vehicle_prices
              ?.dropoff,
          ),
      },
    };

    try {
      if (
        editingCoverage
      ) {
        await updateSupplierCoverage(
          editingCoverage.id,
          payload,
        );

        setMessage(
          t.updated,
        );
      } else {
        await createSupplierCoverage(
          {
            ...payload,

            airport_id:
              Number(
                form.airport_id,
              ),
          },
        );

        setMessage(
          t.created,
        );
      }

      setShowForm(false);

      setEditingCoverage(
        null,
      );

      setPolygonPoints(
        [],
      );

      await loadCoverages();
    } catch (
      requestError
    ) {
      setError(
        getErrorMessage(
          requestError,
          t.saveError,
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(
    coverage,
    field,
  ) {
    setError("");
    setMessage("");

    try {
      await updateSupplierCoverage(
        coverage.id,
        {
          [field]:
            !coverage[
              field
            ],
        },
      );

      await loadCoverages();

      setMessage(
        t.updated,
      );
    } catch (
      requestError
    ) {
      setError(
        getErrorMessage(
          requestError,
          t.updateError,
        ),
      );
    }
  }

  async function handleDelete(
    coverage,
  ) {
    const label =
      coverage.label ||
      coverage.location
        ?.name ||
      t.deleteFallback;

    const confirmed =
      window.confirm(
        `${label} ${t.deleteConfirmSuffix}`,
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await deleteSupplierCoverage(
        coverage.id,
      );

      setMessage(
        t.deleted,
      );

      await loadCoverages();
    } catch (
      requestError
    ) {
      setError(
        getErrorMessage(
          requestError,
          t.deleteError,
        ),
      );
    }
  }

  const mapCenter =
    getAirportCenter(
      selectedAirport,
    );

  return (
    <main className="supplier-dashboard supplier-management-page">
      <section className="supplier-page-heading">
        <div>
          <span className="supplier-eyebrow">
            {t.eyebrow}
          </span>

          <h1>
            {t.title}
          </h1>

          <p>
            {t.description}
          </p>
        </div>

        <div className="supplier-heading-actions">
          <button
            className="supplier-secondary-button"
            type="button"
            disabled={loading}
            onClick={
              loadCoverages
            }
          >
            {t.refresh}
          </button>

          <button
            className="supplier-primary-button"
            type="button"
            onClick={
              openCreateForm
            }
          >
            {t.addAirport}
          </button>
        </div>
      </section>

      {error && (
        <div className="supplier-message error">
          {error}
        </div>
      )}

      {message && (
        <div className="supplier-message success">
          {message}
        </div>
      )}

      <section className="supplier-summary-grid supplier-management-summary">
        <SummaryCard
          label={
            t.totalAreas
          }
          value={
            summary.total
          }
        />

        <SummaryCard
          label={
            t.active
          }
          value={
            summary.active
          }
        />

        <SummaryCard
          label={
            t.pickup
          }
          value={
            summary.pickup
          }
        />

        <SummaryCard
          label={
            t.dropoff
          }
          value={
            summary.dropoff
          }
        />
      </section>

      <section className="supplier-management-card">
        <div className="supplier-section-heading">
          <div>
            <h2>
              {t.servicePoints}
            </h2>

            <p>
              {
                coverages.length
              }{" "}
              {t.records}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="supplier-empty-state">
            {t.loading}
          </div>
        ) : coverages.length ===
          0 ? (
          <div className="supplier-empty-state">
            <strong>
              {t.emptyTitle}
            </strong>

            <p>
              {
                t.emptyDescription
              }
            </p>
          </div>
        ) : (
          <div className="supplier-management-list">
            {groupedCoverages.map(
              (group) => (
                <section
                  key={
                    group.key
                  }
                  className="supplier-coverage-group"
                  style={{
                    borderBottom:
                      "1px solid rgba(148, 163, 184, 0.18)",
                  }}
                >
                  <div
                    className="supplier-coverage-group-header"
                    style={{
                      display:
                        "grid",

                      gridTemplateColumns:
                        "minmax(260px, 1.5fr) minmax(180px, 1fr) 110px",

                      gap:
                        "24px",

                      alignItems:
                        "center",

                      padding:
                        "22px 28px 14px",
                    }}
                  >
                    <div className="supplier-vehicle-identity">
                      <div className="supplier-management-avatar">
                        ✈
                      </div>

                      <div>
                        <strong>
                          {group.code ||
                            t.airport}
                        </strong>

                        <span>
                          {group.name ||
                            t.airport}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="supplier-field-label">
                        {
                          t.location
                        }
                      </span>

                      <strong>
                        {group.locationText ||
                          t.notSpecified}
                      </strong>
                    </div>

                    <div>
                      <span className="supplier-field-label">
                        {
                          t.zones
                        }
                      </span>

                      <strong>
                        {
                          group.items
                            .length
                        }
                      </strong>
                    </div>
                  </div>

                  <div
                    className={[
                      "supplier-coverage-group-items",
                      group.items.length > 4 ? "is-scrollable" : "",
                    ].filter(Boolean).join(" ")}
                  >
                    {group.items.map(
                      (
                        coverage,
                      ) => {
                        const isPolygon =
                          coverage
                            .coverage_type ===
                          "polygon";

                        return (
                          <article
                            key={
                              coverage.id
                            }
                            className="supplier-coverage-child-row"
                            style={{
                              display:
                                "grid",

                              gridTemplateColumns:
                                "minmax(280px, 1.5fr) minmax(220px, 1fr) minmax(160px, 0.8fr) auto",

                              gap:
                                "22px",

                              alignItems:
                                "center",

                              padding:
                                "16px 28px 18px 88px",

                              borderTop:
                                "1px solid rgba(148, 163, 184, 0.12)",
                            }}
                          >
                            <div
                              className="supplier-coverage-zone-name"
                              style={{
                                display:
                                  "flex",

                                gap:
                                  "12px",

                                alignItems:
                                  "center",
                              }}
                            >
                              <span
                                style={{
                                  display:
                                    "inline-flex",

                                  alignItems:
                                    "center",

                                  justifyContent:
                                    "center",

                                  width:
                                    "32px",

                                  height:
                                    "32px",

                                  borderRadius:
                                    "10px",
                                }}
                              >
                                {isPolygon
                                  ? "⬡"
                                  : "◎"}
                              </span>

                              <div
                                style={{
                                  display:
                                    "flex",

                                  flexDirection:
                                    "column",

                                  gap:
                                    "4px",
                                }}
                              >
                                <strong>
                                  {isPolygon
                                    ? coverage.label ||
                                      t.polygon
                                    : coverage.label ||
                                      t.standardCoverage}
                                </strong>

                                <small>
                                  {isPolygon
                                    ? `${t.polygon} · ${
                                        normalizePolygon(
                                          coverage.polygon,
                                        )
                                          .length
                                      } ${t.point}`
                                    : `${t.serviceRadius} · ${formatRadius(
                                        coverage.service_radius_meters,
                                      )}`}
                                </small>
                              </div>
                            </div>

                            <div className="supplier-coverage-flags">
                              <button
                                type="button"
                                className={
                                  coverage
                                    .pickup_enabled
                                    ? "supplier-mini-toggle active"
                                    : "supplier-mini-toggle"
                                }
                                onClick={() =>
                                  handleToggle(
                                    coverage,
                                    "pickup_enabled",
                                  )
                                }
                              >
                                {
                                  t.pickup
                                }
                              </button>

                              <button
                                type="button"
                                className={
                                  coverage
                                    .dropoff_enabled
                                    ? "supplier-mini-toggle active"
                                    : "supplier-mini-toggle"
                                }
                                onClick={() =>
                                  handleToggle(
                                    coverage,
                                    "dropoff_enabled",
                                  )
                                }
                              >
                                {
                                  t.dropoff
                                }
                              </button>
                            </div>

                            <label className="supplier-status-select">
                              <span className="supplier-field-label">
                                {
                                  t.status
                                }
                              </span>

                              <select
                                value={
                                  coverage
                                    .is_active
                                    ? "active"
                                    : "inactive"
                                }
                                onChange={() =>
                                  handleToggle(
                                    coverage,
                                    "is_active",
                                  )
                                }
                              >
                                <option value="active">
                                  {
                                    t.active
                                  }
                                </option>

                                <option value="inactive">
                                  {
                                    t.inactive
                                  }
                                </option>
                              </select>
                            </label>

                            <div className="supplier-row-actions">
                              <button
                                className="supplier-row-button"
                                type="button"
                                onClick={() =>
                                  openEditForm(
                                    coverage,
                                  )
                                }
                              >
                                {
                                  t.edit
                                }
                              </button>

                              <button
                                className="supplier-row-button danger"
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    coverage,
                                  )
                                }
                              >
                                {
                                  t.delete
                                }
                              </button>
                            </div>
                          </article>
                        );
                      },
                    )}
                  </div>
                </section>
              ),
            )}
          </div>
        )}
      </section>

      {showForm && (
        <div
          className="supplier-modal-backdrop"
          role="presentation"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeForm();
            }
          }}
        >
          <section
            className="supplier-modal-card supplier-coverage-modal-large"
            role="dialog"
            aria-modal="true"
            aria-label={
              editingCoverage
                ? t.editAria
                : t.addAria
            }
          >
            <div className="supplier-modal-header">
              <div>
                <span className="supplier-eyebrow">
                  {
                    t.coverageArea
                  }
                </span>

                <h2>
                  {editingCoverage
                    ? t.editCoverage
                    : t.addNewAirport}
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeForm
                }
              >
                ×
              </button>
            </div>

            <form
              className="supplier-management-form"
              onSubmit={
                handleSubmit
              }
            >
              {!editingCoverage && (
                <FormField
                  label={
                    t.searchAirport
                  }
                >
                  <div className="supplier-airport-search">
                    <input
                      required
                      value={
                        airportQuery
                      }
                      placeholder={
                        t.searchPlaceholder
                      }
                      onChange={(
                        event,
                      ) => {
                        setAirportQuery(
                          event
                            .target
                            .value,
                        );

                        setSelectedAirport(
                          null,
                        );

                        updateField(
                          "airport_id",
                          "",
                        );

                        setPolygonPoints(
                          [],
                        );
                      }}
                    />

                    {airportSearching && (
                      <small>
                        {
                          t.searchingAirports
                        }
                      </small>
                    )}

                    {airportResults.length >
                      0 && (
                      <div className="supplier-airport-results">
                        {airportResults.map(
                          (
                            airport,
                          ) => (
                            <button
                              key={
                                airport.id
                              }
                              type="button"
                              onClick={() =>
                                selectAirport(
                                  airport,
                                )
                              }
                            >
                              <strong>
                                {airport
                                  .iata_code ||
                                  airport
                                    .icao_code ||
                                  "—"}
                              </strong>

                              <span>
                                {
                                  airport.name
                                }
                              </span>

                              <small>
                                {[
                                  airport
                                    .city
                                    ?.name,

                                  airport
                                    .country
                                    ?.name,
                                ]
                                  .filter(
                                    Boolean,
                                  )
                                  .join(
                                    ", ",
                                  )}
                              </small>
                            </button>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </FormField>
              )}

              {selectedAirport && (
                <div className="supplier-selected-airport">
                  <span>
                    ✓
                  </span>

                  <div>
                    <strong>
                      {selectedAirport
                        .iata_code ||
                        selectedAirport
                          .icao_code}
                      {" · "}
                      {
                        selectedAirport.name
                      }
                    </strong>

                    <small>
                      {[
                        selectedAirport
                          .city
                          ?.name,

                        selectedAirport
                          .country
                          ?.name,
                      ]
                        .filter(
                          Boolean,
                        )
                        .join(
                          ", ",
                        )}
                    </small>
                  </div>
                </div>
              )}

              <div className="supplier-form-grid">
                <FormField
                  label={
                    t.displayName
                  }
                >
                  <input
                    value={
                      form.label
                    }
                    placeholder={
                      t.displayNamePlaceholder
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "label",
                        event
                          .target
                          .value,
                      )
                    }
                  />
                </FormField>

                <FormField
                  label={
                    t.serviceRadiusMeters
                  }
                >
                  <input
                    type="number"
                    min="0"
                    max="500000"
                    value={
                      form
                        .service_radius_meters
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "service_radius_meters",
                        event
                          .target
                          .value,
                      )
                    }
                  />
                </FormField>

                <FormField
                  label={
                    t.basePrice
                  }
                >
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.base_price
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "base_price",
                        event
                          .target
                          .value,
                      )
                    }
                  />
                </FormField>

                <FormField
                  label={
                    t.currency
                  }
                >
                  <select
                    value={
                      form.currency
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "currency",
                        event
                          .target
                          .value,
                      )
                    }
                  >
                    <option value="EUR">
                      EUR
                    </option>

                    <option value="USD">
                      USD
                    </option>

                    <option value="GBP">
                      GBP
                    </option>

                    <option value="TRY">
                      TRY
                    </option>
                  </select>
                </FormField>
              </div>

              <section className="supplier-polygon-section">
                <div className="supplier-section-heading">
                  <div>
                    <h3>
                      {
                        t.polygonTitle
                      }
                    </h3>

                    <p>
                      {
                        t.polygonDescription
                      }
                    </p>
                  </div>
                </div>

                <small className="supplier-polygon-help">
                  {
                    t.polygonOptional
                  }
                </small>

                <PolygonEditor
                  center={
                    mapCenter
                  }
                  points={
                    polygonPoints
                  }
                  onChange={
                    setPolygonPoints
                  }
                />

                <div className="supplier-polygon-actions">
                  <span>
                    {
                      polygonPoints.length
                    }{" "}
                    {t.point}
                  </span>

                  {polygonPoints.length >
                    0 && (
                    <button
                      type="button"
                      className="supplier-secondary-button"
                      onClick={() =>
                        setPolygonPoints(
                          (
                            current,
                          ) =>
                            current.slice(
                              0,
                              -1,
                            ),
                        )
                      }
                    >
                      {
                        t.undoPoint
                      }
                    </button>
                  )}

                  {polygonPoints.length >
                    0 && (
                    <button
                      type="button"
                      className="supplier-secondary-button"
                      onClick={() =>
                        setPolygonPoints(
                          [],
                        )
                      }
                    >
                      {
                        t.clearPolygon
                      }
                    </button>
                  )}

                  {polygonPoints.length >=
                    3 && (
                    <strong className="supplier-polygon-ready">
                      ✓{" "}
                      {
                        t.polygonReady
                      }
                    </strong>
                  )}
                </div>
              </section>

              <section className="supplier-price-section">
                <div className="supplier-section-heading">
                  <div>
                    <h3>
                      {
                        t.vehiclePrices
                      }
                    </h3>

                    <p>
                      {
                        t.perTransfer
                      }
                    </p>
                  </div>

                  <div className="supplier-price-tabs">
                    <button
                      type="button"
                      className={
                        priceMode ===
                        "pickup"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setPriceMode(
                          "pickup",
                        )
                      }
                    >
                      {
                        t.pickupPrices
                      }
                    </button>

                    <button
                      type="button"
                      className={
                        priceMode ===
                        "dropoff"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setPriceMode(
                          "dropoff",
                        )
                      }
                    >
                      {
                        t.dropoffPrices
                      }
                    </button>
                  </div>
                </div>

                <div className="supplier-vehicle-price-grid">
                  {VEHICLE_TYPES.map(
                    (
                      vehicle,
                    ) => (
                      <label
                        key={
                          vehicle.key
                        }
                        className="supplier-vehicle-price-card"
                      >
                        <span className="supplier-vehicle-price-icon">
                          {
                            vehicle.icon
                          }
                        </span>

                        <strong>
                          {getVehicleLabel(
                            vehicle.key,
                            t,
                          )}
                        </strong>

                        <div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={
                              form
                                .vehicle_prices
                                ?.[
                                  priceMode
                                ]?.[
                                  vehicle
                                    .key
                                ] ??
                              ""
                            }
                            onChange={(
                              event,
                            ) =>
                              updateVehiclePrice(
                                vehicle.key,
                                event
                                  .target
                                  .value,
                              )
                            }
                          />

                          <small>
                            {
                              form.currency
                            }
                          </small>
                        </div>
                      </label>
                    ),
                  )}
                </div>
              </section>

              <div className="supplier-coverage-options">
                <label>
                  <input
                    type="checkbox"
                    checked={
                      form
                        .pickup_enabled
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "pickup_enabled",
                        event
                          .target
                          .checked,
                      )
                    }
                  />

                  <span>
                    {
                      t.pickupService
                    }
                  </span>
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={
                      form
                        .dropoff_enabled
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "dropoff_enabled",
                        event
                          .target
                          .checked,
                      )
                    }
                  />

                  <span>
                    {
                      t.dropoffService
                    }
                  </span>
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={
                      form.is_active
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "is_active",
                        event
                          .target
                          .checked,
                      )
                    }
                  />

                  <span>
                    {
                      t.coverageActive
                    }
                  </span>
                </label>
              </div>

              <div className="supplier-modal-actions">
                <button
                  className="supplier-secondary-button"
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={
                    closeForm
                  }
                >
                  {t.cancel}
                </button>

                <button
                  className="supplier-primary-button"
                  type="submit"
                  disabled={
                    saving ||
                    (!editingCoverage &&
                      !form.airport_id)
                  }
                >
                  {saving
                    ? t.saving
                    : editingCoverage
                      ? t.saveChanges
                      : t.addAirportAction}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function PolygonEditor({
  center,
  points,
  onChange,
}) {
  const mapCenter =
    center ||
    DEFAULT_CENTER;

  return (
    <div
      className="supplier-polygon-map-wrap"
      style={{
        width: "100%",
        height: "420px",
        marginTop: "14px",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      <MapContainer
        center={
          mapCenter
        }
        zoom={12}
        scrollWheelZoom
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RecenterMap
          center={
            mapCenter
          }
        />

        <PolygonClickHandler
          onChange={
            onChange
          }
        />

        {points.map(
          (
            point,
            index,
          ) => (
            <DraggablePolygonPoint
              key={`${point[0]}-${point[1]}-${index}`}
              position={
                point
              }
              index={
                index
              }
              onMove={(
                nextPoint,
              ) =>
                onChange(
                  (
                    current,
                  ) =>
                    current.map(
                      (
                        item,
                        itemIndex,
                      ) =>
                        itemIndex ===
                        index
                          ? nextPoint
                          : item,
                    ),
                )
              }
            />
          ),
        )}

        {points.length >=
          3 && (
          <Polygon
            positions={
              points
            }
          />
        )}
      </MapContainer>
    </div>
  );
}

function PolygonClickHandler({
  onChange,
}) {
  useMapEvents({
    click(event) {
      onChange(
        (
          current,
        ) => [
          ...current,

          [
            Number(
              event.latlng.lat.toFixed(
                6,
              ),
            ),

            Number(
              event.latlng.lng.toFixed(
                6,
              ),
            ),
          ],
        ],
      );
    },
  });

  return null;
}

function DraggablePolygonPoint({
  position,
  index,
  onMove,
}) {
  const icon =
    L.divIcon({
      className:
        "supplier-polygon-vertex-wrap",

      html:
        `<span style="
          display:flex;
          align-items:center;
          justify-content:center;
          width:28px;
          height:28px;
          border-radius:50%;
          background:#0ea5e9;
          color:white;
          border:3px solid white;
          font-size:12px;
          font-weight:800;
          box-shadow:0 3px 10px rgba(0,0,0,.35);
        ">${index + 1}</span>`,

      iconSize: [
        28,
        28,
      ],

      iconAnchor: [
        14,
        14,
      ],
    });

  return (
    <Marker
      position={
        position
      }
      icon={
        icon
      }
      draggable
      eventHandlers={{
        dragend(
          event,
        ) {
          const next =
            event.target.getLatLng();

          onMove([
            Number(
              next.lat.toFixed(
                6,
              ),
            ),

            Number(
              next.lng.toFixed(
                6,
              ),
            ),
          ]);
        },
      }}
    />
  );
}

function RecenterMap({
  center,
}) {
  const map =
    useMap();

  const latitude =
    Array.isArray(center)
      ? Number(center[0])
      : null;

  const longitude =
    Array.isArray(center)
      ? Number(center[1])
      : null;

  useEffect(() => {
    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
    ) {
      map.setView(
        [
          latitude,
          longitude,
        ],
        12,
      );
    }
  }, [
    latitude,
    longitude,
    map,
  ]);

  return null;
}

function SummaryCard({
  label,
  value,
}) {
  return (
    <article className="supplier-summary-card">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </article>
  );
}

function FormField({
  label,
  children,
}) {
  return (
    <label className="supplier-form-field">
      <span>
        {label}
      </span>

      {children}
    </label>
  );
}

function formatRadius(
  value,
) {
  const meters =
    Number(
      value || 0,
    );

  if (
    meters >= 1000
  ) {
    return `${(
      meters / 1000
    ).toFixed(
      meters % 1000 ===
        0
        ? 0
        : 1,
    )} km`;
  }

  return `${meters} m`;
}

function getAirportCenter(
  airport,
) {
  if (!airport) {
    return DEFAULT_CENTER;
  }

  const latitude =
    Number(
      airport.latitude ??
        airport.lat,
    );

  const longitude =
    Number(
      airport.longitude ??
        airport.lng,
    );

  if (
    Number.isFinite(
      latitude,
    ) &&
    Number.isFinite(
      longitude,
    )
  ) {
    return [
      latitude,
      longitude,
    ];
  }

  return DEFAULT_CENTER;
}

function normalizePolygon(
  polygon,
) {
  if (
    !Array.isArray(
      polygon,
    )
  ) {
    return [];
  }

  return polygon
    .map(
      (
        point,
      ) => {
        if (
          Array.isArray(
            point,
          ) &&
          point.length >=
            2
        ) {
          const lat =
            Number(
              point[0],
            );

          const lng =
            Number(
              point[1],
            );

          if (
            Number.isFinite(
              lat,
            ) &&
            Number.isFinite(
              lng,
            )
          ) {
            return [
              lat,
              lng,
            ];
          }
        }

        return null;
      },
    )
    .filter(Boolean);
}

function cleanPriceObject(
  prices,
) {
  const source =
    prices || {};

  return Object.fromEntries(
    Object.entries(
      source,
    )
      .filter(
        (
          [
            ,
            value,
          ],
        ) =>
          value !== "" &&
          value !== null &&
          value !== undefined &&
          Number.isFinite(
            Number(
              value,
            ),
          ),
      )
      .map(
        (
          [
            key,
            value,
          ],
        ) => [
          key,
          Number(
            value,
          ),
        ],
      ),
  );
}

function normalizeVehiclePrices(
  value,
) {
  if (!value) {
    return {
      pickup: {},
      dropoff: {},
    };
  }

  let prices =
    value;

  if (
    typeof prices ===
    "string"
  ) {
    try {
      prices =
        JSON.parse(
          prices,
        );
    } catch {
      return {
        pickup: {},
        dropoff: {},
      };
    }
  }

  if (
    typeof prices !==
      "object" ||
    Array.isArray(
      prices,
    )
  ) {
    return {
      pickup: {},
      dropoff: {},
    };
  }

  if (
    prices.pickup ||
    prices.dropoff
  ) {
    return {
      pickup:
        prices.pickup &&
        typeof prices.pickup ===
          "object" &&
        !Array.isArray(
          prices.pickup,
        )
          ? prices.pickup
          : {},

      dropoff:
        prices.dropoff &&
        typeof prices.dropoff ===
          "object" &&
        !Array.isArray(
          prices.dropoff,
        )
          ? prices.dropoff
          : {},
    };
  }

  return {
    pickup:
      prices,

    dropoff:
      {},
  };
}

function groupCoveragesByLocation(
  coverages,
) {
  const groups =
    new Map();

  for (
    const coverage of
    coverages || []
  ) {
    const locationId =
      coverage.location_id ||
      coverage.location
        ?.id ||
      coverage.location
        ?.airport_id ||
      coverage.location
        ?.code ||
      coverage.id;

    const key =
      String(
        locationId,
      );

    if (
      !groups.has(
        key,
      )
    ) {
      const cityName =
        coverage.city
          ?.name ||
        "";

      const countryName =
        coverage.country
          ?.name ||
        "";

      groups.set(
        key,
        {
          key,

          code:
            coverage
              .location
              ?.code ||
            "",

          name:
            coverage
              .location
              ?.name ||
            coverage.label ||
            "",

          locationText:
            [
              cityName,
              countryName,
            ]
              .filter(
                Boolean,
              )
              .join(
                ", ",
              ),

          items: [],
        },
      );
    }

    groups
      .get(
        key,
      )
      .items
      .push(
        coverage,
      );
  }

  return Array.from(
    groups.values(),
  ).map(
    (
      group,
    ) => ({
      ...group,

      items: [
        ...group.items,
      ].sort(
        (
          a,
          b,
        ) => {
          const aPolygon =
            a.coverage_type ===
            "polygon";

          const bPolygon =
            b.coverage_type ===
            "polygon";

          if (
            aPolygon !==
            bPolygon
          ) {
            return aPolygon
              ? 1
              : -1;
          }

          return String(
            a.label ||
              "",
          ).localeCompare(
            String(
              b.label ||
                "",
            ),
          );
        },
      ),
    }),
  );
}

function getVehicleLabel(
  key,
  t,
) {
  const labels = {
    standard_car:
      t.standardCar,

    executive_car:
      t.executiveCar,

    luxury_car:
      t.luxuryCar,

    people_carrier:
      t.peopleCarrier,

    executive_people_carrier:
      t.executivePeopleCarrier,

    large_people_carrier:
      t.largePeopleCarrier,

    minibus:
      t.minibus,
  };

  return (
    labels[key] ||
    key
  );
}

function getErrorMessage(
  error,
  fallback,
) {
  const validationErrors =
    error?.response
      ?.data?.errors;

  if (
    validationErrors
  ) {
    const firstError =
      Object.values(
        validationErrors,
      )?.[0]?.[0];

    if (firstError) {
      return firstError;
    }
  }

  return (
    error?.response
      ?.data?.message ||
    error?.message ||
    fallback
  );
}