import axiosClient from "@/shared/lib/axiosClient";

export async function getFavorites(signal) {
  return axiosClient.get("/api/favorites", { signal }).then((r) => r.data);
}

export async function addFavorite(resourceId, resourceType, signal) {
  return axiosClient
    .post(
      "/api/favorites",
      { resourceId, resourceType },
      { signal }
    )
    .then((r) => r.data);
}

export async function removeFavorite(resourceId, resourceType, signal) {
  return axiosClient
    .delete("/api/favorites", {
      data: { resourceId, resourceType },
      signal,
    })
    .then((r) => r.data);
}

export async function checkFavorite(resourceId, resourceType, signal) {
  return axiosClient
    .get("/api/favorites/check", {
      params: { resourceId, resourceType },
      signal,
    })
    .then((r) => r.data);
}

