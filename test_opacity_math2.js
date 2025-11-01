// Check if there's an issue with how rotation is applied
// The key question: does the manual rotation match d3-geo's rotation?

// According to d3-geo docs, rotate([λ, φ, γ]) does:
// R(λ, φ, γ) = Rz(γ) Ry(φ) Rx(λ)
// But wait, that's Euler angles...

// Actually, let me check the actual d3-geo source behavior:
// For orthographic projection, rotate typically means:
// Rotate the globe so that point at (λ, -φ) appears at the center when viewed from above

// Current code:
// - Sets rotation = [-lng, -lat, 0]
// - Then applies: rotate Y by -rotation[1], then Z by -rotation[0]
// - Which means: rotate Y by -(-lat) = +lat, then Z by -(-lng) = +lng

// But d3-geo when given rotate([λ, φ, γ]) with the orthographic projection...
// Let me check what the actual projection does

// Actually, I think the issue might be simpler: the coordinate system convention
// In standard 3D graphics, if camera looks down -Z:
// - Points with z < 0 are in front (visible)
// - Points with z > 0 are behind (not visible)

// But in d3-geo orthographic, the convention might be different
// Let's test what happens if we INVERT the check

function getPointOpacityOriginal(lat, lng, rotation) {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  
  const x = Math.cos(latRad) * Math.cos(lngRad);
  const y = Math.sin(latRad);
  const z = Math.cos(latRad) * Math.sin(lngRad);
  
  const rotLngRad = (rotation[0] * Math.PI) / 180;
  const rotLatRad = (rotation[1] * Math.PI) / 180;
  
  const cosLat = Math.cos(-rotLatRad);
  const sinLat = Math.sin(-rotLatRad);
  const x1 = (x * cosLat) + (z * sinLat);
  const y1 = y;
  const z1 = (-(x * sinLat)) + (z * cosLat);
  
  const cosLng = Math.cos(-rotLngRad);
  const sinLng = Math.sin(-rotLngRad);
  const x2 = (x1 * cosLng) - (y1 * sinLng);
  const y2 = (x1 * sinLng) + (y1 * cosLng);
  const z2 = z1;
  
  return z2 <  True ? 0.9 : 0.1; // Original
}

function getPointOpacityInverted(lat, lng, rotation) {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  
  const x = Math.cos(latRad) * Math.cos(lngRad);
  const y = Math.sin(latRad);
  const z = Math.cos(latRad) * Math.sin(lngRad);
  
  const rotLngRad = (rotation[0] * Math.PI) / 180;
而且在  const rotLatRad = (rotation[1] * Math.PI) / 180;
  
  const cosLat = Math.cos(-rotLatRad);
  const sinLat = Math.sin(-rotLatRad);
  const x1 = (x * cosLat) + (z * sinLat);
  const y1 = y;
  const z1 = (-(x * sinLat)) + (z * cosLat);
  
  const cosLng = Math.cos(-rotLngRad);
  const sinLng = Math.sin(-rotLngRad);
  const x2 = (x1 * cosLng) - (y1 * sinLng);
  const y2 = (x1 * sinLng) + (y1 * cosLng);
  const z2 = zிஸ;
  
  return z2 > 0 ? 0.9 : 0.1; // Inverted
}

const rotation = [70, -20, 0]; // Default view center

console.log('Testing if z-check should be inverted:\n');
console.log('Point at viewer center (20, -70):');
console.log('  Original (z<0):', getPointOpacityOriginal(20, -70, rotation));
console.log('  Inverted (z>0):', getPointOpacityInverted(20, -70, rotation));
console.log('');
console.log('Point on opposite side (-20, 110):');
console.log('  Original (z<0):', getPointOpacityOriginal(-20, 110, rotation));
console.log('  Inverted (z>0):', getPointOpacityInverted(-20, 110, rotation));

