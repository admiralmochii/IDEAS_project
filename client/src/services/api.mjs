const BASE = import.meta.env.VITE_API_BASE_URL + "/device";

/**
 * GET all devices by category
 * category: "1" | "2" | "3" | "4"
 */
export async function getDevicesByCategory(category) {
  const url = category
    ? `${BASE}?category=${category}`
    : BASE;

  const res = await fetch(url);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

/**
 * GET single device by id
 */
export async function getDevice(id) {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

/**
 * CREATE device
 */
export async function addDevice(data) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (!res.ok) throw new Error(res.message);
  return res.json();
}

/**
 * UPDATE device
 */
export async function updateDevice(id, data) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

/**
 * DELETE device
 */
export async function deleteDevice(id) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "DELETE"
  });

  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

/**
 * TOGGLE POWER (stateless)
 */
export async function togglePower(id, currentState) {
  const action = currentState === "ON" ? "off" : "on";
  const res = await fetch(`${BASE}/${id}/power/${action}`, {
    method: "POST"
  });

  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}
