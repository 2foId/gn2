'use client';

import { GeoJSON, MapContainer, TileLayer, Marker, Popup, Polygon, useMap, useMapEvents } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { KABUPATEN_BOUNDS, KABUPATEN_CENTER } from '@/lib/kabupatenBounds';

// Fix default marker icon Leaflet yang sering pecah di bundler modern
const blueIcon = L.divIcon({
  className: 'guyub-map-pin',
  html: '<span class="guyub-map-pin__head guyub-map-pin__head--blue"></span>',
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -42],
});

const draftIcon = L.divIcon({
  className: 'guyub-map-pin guyub-map-pin--draft',
  html: '<span class="guyub-map-pin__head guyub-map-pin__head--red"></span>',
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -42],
});

const medisIcon = L.divIcon({
  className: 'guyub-map-pin',
  html: '<span class="guyub-map-pin__head guyub-map-pin__head--red"><span class="guyub-map-pin__icon">+</span></span>',
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -42],
});

const renovasiIcon = L.divIcon({
  className: 'guyub-map-pin',
  html: '<span class="guyub-map-pin__head guyub-map-pin__head--green"><svg class="guyub-map-pin__icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span>',
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -42],
});

const tenagaKerjaIcon = L.divIcon({
  className: 'guyub-map-pin',
  html: '<span class="guyub-map-pin__head guyub-map-pin__head--blue"><svg class="guyub-map-pin__icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></span>',
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -42],
});

const lainnyaIcon = L.divIcon({
  className: 'guyub-map-pin',
  html: '<span class="guyub-map-pin__head guyub-map-pin__head--gray"><span class="guyub-map-pin__icon">•••</span></span>',
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -42],
});

function getCategoryIcon(kategori: string) {
  switch (kategori) {
    case 'MEDIS':
      return medisIcon;
    case 'KERUSAKAN_RUMAH':
      return renovasiIcon;
    case 'TENAGA_KERJA':
      return tenagaKerjaIcon;
    default:
      return lainnyaIcon;
  }
}

function getKategoriLabel(kategori: string) {
  switch (kategori) {
    case 'MEDIS':
      return 'Medis';
    case 'KERUSAKAN_RUMAH':
      return 'Renovasi Rumah';
    case 'TENAGA_KERJA':
      return 'Tenaga Kerja';
    default:
      return 'Lainnya';
  }
}

// Pusat peta default: Kota Surakarta
const DEFAULT_CENTER: [number, number] = [-7.5667, 110.8333];

// Buffer kecil (derajat) di sekitar batas kabupaten agar ada ruang navigasi sedikit lebih lebar.
const BOUNDS_BUFFER = 0.12;

function expandBounds(bounds: [[number, number], [number, number]]): [[number, number], [number, number]] {
  const [[swLat, swLng], [neLat, neLng]] = bounds;
  return [
    [swLat - BOUNDS_BUFFER, swLng - BOUNDS_BUFFER],
    [neLat + BOUNDS_BUFFER, neLng + BOUNDS_BUFFER],
  ];
}

export interface MapPin {
  id: string;
  judul: string;
  kategori: string;
  status: string;
  latitude: number;
  longitude: number;
  preferensiRelawan?: string;
  cocokPreferensi?: boolean;
  pembuat?: { nama: string };
}

export function MapView({
  pins,
  onSelect,
  selectionMode = false,
  selectedLocation,
  onLocationSelect,
  kabupaten = '',
}: {
  pins: MapPin[];
  onSelect?: (pin: MapPin) => void;
  selectionMode?: boolean;
  selectedLocation?: [number, number];
  onLocationSelect?: (latitude: number, longitude: number) => void;
  kabupaten?: string;
}) {
  const [boundary, setBoundary] = useState<GeoJSON.GeoJsonObject | null>(null);
  const [boundaryWarning, setBoundaryWarning] = useState(false);
  const [boundaryWarningFading, setBoundaryWarningFading] = useState(false);
  const [activeBounds, setActiveBounds] = useState<[[number, number], [number, number]]>(expandBounds(KABUPATEN_BOUNDS['Kota Surakarta']));
  const [activeCenter, setActiveCenter] = useState<[number, number]>(DEFAULT_CENTER);

  useEffect(() => {
    const center = kabupaten && KABUPATEN_CENTER[kabupaten] ? KABUPATEN_CENTER[kabupaten] : DEFAULT_CENTER;
    const baseBounds = kabupaten && KABUPATEN_BOUNDS[kabupaten] ? KABUPATEN_BOUNDS[kabupaten] : KABUPATEN_BOUNDS['Kota Surakarta'];
    const bounds = expandBounds(baseBounds);
    setActiveCenter(center);
    setActiveBounds(bounds);
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(kabupaten + ', Jawa Tengah, Indonesia')}&polygon_geojson=1&format=json&limit=1`,
    )
      .then((response) => response.json())
      .then((results: { geojson?: GeoJSON.GeoJsonObject }[]) => setBoundary(results[0]?.geojson ?? null))
      .catch(() => setBoundary(null));
  }, [kabupaten]);

  function resetInvalidDraftPin(marker: L.Marker) {
    marker.setLatLng(activeCenter);
    onLocationSelect?.(activeCenter[0], activeCenter[1]);
    setBoundaryWarning(true);
    setBoundaryWarningFading(false);
    window.setTimeout(() => setBoundaryWarningFading(true), 4400);
    window.setTimeout(() => setBoundaryWarning(false), 5000);
  }

  return (
    <div className={`relative resize-y overflow-hidden rounded-xl border-2 ${selectionMode ? 'z-30 border-guyub-gula shadow-2xl' : 'border-green-500'}`} style={{ height: '600px', minHeight: '360px', maxHeight: '80vh' }}>
      {selectionMode && <div className="pointer-events-none absolute inset-0 z-10 ring-4 ring-guyub-gula/70" />}
      {selectionMode && boundaryWarning && <div className={`pointer-events-none absolute left-3 right-3 top-3 z-40 rounded-lg border-2 border-yellow-400 bg-gray-700/95 px-4 py-3 text-center font-body text-sm font-medium text-white transition-opacity duration-500 ${boundaryWarningFading ? 'opacity-0' : 'opacity-100'}`}>Tetap di dalam batas ${kabupaten || 'Jawa Tengah'}.</div>}
      <span className="pointer-events-none absolute bottom-2 left-3 z-20 rounded bg-white/90 px-2 py-1 font-body text-[11px] text-stone-600 shadow-sm">Tarik sudut kanan bawah untuk mengubah ukuran</span>
      <MapContainer
        center={activeCenter}
        zoom={kabupaten ? 11 : 9}
        minZoom={8}
        maxBounds={activeBounds}
        maxBoundsViscosity={1.0}
        style={{ height: '100%', width: '100%' }}
      >
        <MapResizeWatcher />
        {boundary && <MapBoundaryFitter boundary={boundary} />}
        {selectionMode && <MapLocationPicker boundary={boundary} activeBounds={activeBounds} onLocationSelect={onLocationSelect} />}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          bounds={activeBounds}
        />
        {boundary && <GeoJSON data={boundary} style={{ color: '#d97706', weight: 3, fillColor: '#facc15', fillOpacity: 0.06 }} />}
        {selectionMode && boundary && <Polygon positions={getMaskRings(boundary)} pathOptions={{ stroke: false, fillColor: '#4b5563', fillOpacity: 0.48 }} />}
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.latitude, pin.longitude]}
            icon={getCategoryIcon(pin.kategori)}
            eventHandlers={{ click: () => onSelect?.(pin) }}
          >
            <Popup className="font-body">
              <p className="font-semibold">{pin.judul}</p>
              <p className="text-xs text-stone-600">{getKategoriLabel(pin.kategori)}</p>
              <p className="text-xs">Status: {pin.status.replace('_', ' ')}</p>
              {pin.preferensiRelawan === 'PEMUDA_18_30' && <span className="mt-1 inline-flex rounded-full bg-guyub-gula/25 px-2 py-1 text-[11px] font-semibold text-guyub-bambuDark">Dicari: Pemuda 18–30</span>}
            </Popup>
          </Marker>
        ))}
        {selectionMode && selectedLocation && (
          <Marker
            position={selectedLocation}
            icon={draftIcon}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const location = event.target.getLatLng();
                const outsideBoundary = boundary
                  ? !isInsideBoundary(location, boundary)
                  : !L.latLngBounds(activeBounds).contains(location);
                if (outsideBoundary) {
                  resetInvalidDraftPin(event.target);
                  return;
                }
                onLocationSelect?.(location.lat, location.lng);
              }
            }}
          >
            <Popup className="font-body">Pergeser pin ini atau klik peta untuk menentukan lokasi.</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

function MapLocationPicker({ boundary, activeBounds, onLocationSelect }: { boundary: GeoJSON.GeoJsonObject | null; activeBounds: [[number, number], [number, number]]; onLocationSelect?: (latitude: number, longitude: number) => void }) {
  useMapEvents({
    click: (event) => {
      if ((!boundary && L.latLngBounds(activeBounds).contains(event.latlng)) || (boundary && isInsideBoundary(event.latlng, boundary))) {
        onLocationSelect?.(event.latlng.lat, event.latlng.lng);
      }
    }
  });
  return null;
}

function MapBoundaryFitter({ boundary }: { boundary: GeoJSON.GeoJsonObject }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(L.geoJSON(boundary).getBounds(), { padding: [16, 16] });
  }, [boundary, map]);

  return null;
}

type Coordinate = [number, number];

function getRings(boundary: GeoJSON.GeoJsonObject): Coordinate[][] {
  if (boundary.type === 'Feature') return getRings((boundary as GeoJSON.Feature).geometry as GeoJSON.Geometry);
  if (boundary.type === 'Polygon') return (boundary as GeoJSON.Polygon).coordinates as Coordinate[][];
  if (boundary.type === 'MultiPolygon') return (boundary as GeoJSON.MultiPolygon).coordinates.flat(1) as Coordinate[][];
  return [];
}

function isInsideBoundary(location: L.LatLng, boundary: GeoJSON.GeoJsonObject) {
  return getRings(boundary).some((ring) => pointInRing(location.lng, location.lat, ring));
}

function getMaskRings(boundary: GeoJSON.GeoJsonObject): L.LatLngExpression[][] {
  const outsideRing: L.LatLngExpression[] = [[90, -180], [90, 180], [-90, 180], [-90, -180]];
  const boundaryRings = getRings(boundary).map((ring) => ring.map(([longitude, latitude]) => [latitude, longitude] as L.LatLngExpression));
  return [outsideRing, ...boundaryRings];
}

function pointInRing(x: number, y: number, ring: Coordinate[]) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [currentX, currentY] = ring[index];
    const [previousX, previousY] = ring[previous];
    if (currentY > y !== previousY > y && x < ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX) inside = !inside;
  }
  return inside;
}

function MapResizeWatcher() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}
