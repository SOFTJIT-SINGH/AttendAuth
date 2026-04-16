import * as Location from 'expo-location';

export const toRad = (deg: number) => (deg * Math.PI) / 180;

export const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const checkGeofence = async (target: { lat: number; lon: number; radius: number }) => {
  const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return {
    inZone: haversineDistance(coords.latitude, coords.longitude, target.lat, target.lon) <= target.radius,
    coords,
  };
};

export const isWithinTimeWindow = (start: string, end: string) => {
  const now = new Date();
  const s = new Date(`${now.toISOString().split('T')[0]}T${start}`);
  const e = new Date(`${now.toISOString().split('T')[0]}T${end}`);
  return now >= s && now <= e;
};