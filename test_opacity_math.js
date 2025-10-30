// Test the opacity calculation logic

// Simulate the getPointOpacity function
function getPointOpacity(lat, lng, rotation) {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  
  // Convert to 3D Cartesian coordinates on unit sphere
  const x = Math.cos(latRad) * Math.cos(lngRad);
  const y = Math.sin(latRad);
  const z = Math.cos(latRad) * Math.sin(lngRad);
  
  const rotLngRad = (rotation[0] * Math.PI) / 180;
  const rotLatRad = (rotation[1] * Math.PI) / 180;
  
  // First rotate around Y axis by -latitude (rotation[1])
  const cosLat = Math.cos(-rotLatRad);
  const sinLat = Math.sin(-rotLatRad);
  const x1 = (x * cosLat) + (z * sinLat);
  const y1 = y;
  const z1 = (-(x * sinLat)) + (z * cosLat);
  
  // Then rotate around Z axis by -longitude (rotation[0])
  const cosLng = Math.cos(-rotLngRad);
  const sinLng = Math.sin(-rotLngRad);
  const x2 = (x1 * cosLng) - (y1 * sinLng);
  const y2 = (x1 * sinLng) + (y1 * cosLng);
  const z2 = z1;
  
  return z2 < 0 ? 0.9 : 0.1;
}

// Test cases
console.log('=== Testing opacity calculation ===\n');

// Case 1: Point at viewer's center (defaultPointOfView: lat=20, lng=-70)
// Rotation is set to [-(-70), -20, 0] = [70, -20, 0]
const rotation1 = [70, -20, 0]; // This is what gets set from defaultPointOfView
console.log('Case 1: Point at viewer center (lat=20, lng=-70)');
console.log('Rotation:', rotation1);
const opacity1 = getPointOpacity(20, -70, rotation1);
console.log('Opacity:', opacity1, '(should be HIGH ~0.9, facing camera)');
console.log('');

// Case 2: Point on opposite side of globe
console.log('Case 2: Point on opposite side (lat=-20, lng=110)');
const opacity2 = getPointOpacity(-20, 110, rotation1);
console.log('Opacity:', opacity2, '(should be LOW ~0.1, facing away)');
console.log('');

// Case 3: Point at north pole (should always be visible if rotation doesn't tilt much)
console.log('Case 3: North pole (lat=90, lng=0)');
const opacity3 = getPointOpacity(90, 0, rotation1);
console.log('Opacity:', opacity3);
console.log('');

// Case 4: Check what happens at the "equator" of visibility
console.log('Case 4: Testing points around the globe to see if transition makes sense');
for (let lng = -180; lng <= 180; lng += 45) {
  const opacity = getPointOpacity(0, lng, rotation1);
  console.log(`Lat=0, Lng=${lng}: opacity=${opacity}`);
}

