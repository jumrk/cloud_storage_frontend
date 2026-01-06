import axiosClient from "@/shared/lib/axiosClient";
import sleep from "@/shared/utils/sleep";

export function postMemberStats(members) {
  return axiosClient.post("/api/user/members/stats", {
    memberIds: members.map((m) => m._id),
  });
}

export async function fetchMember() {
  await sleep();
  return axiosClient.get("/api/user/members");
}

export async function checkEmail(e) {
  await sleep();
  return axiosClient.get("/api/user/check-email", {
    params: { email: e.target.value },
  });
}

export async function createMember(form) {
  await sleep();
  return axiosClient.post("/api/user/members", form);
}
