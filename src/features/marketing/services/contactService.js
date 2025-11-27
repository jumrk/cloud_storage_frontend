export default function contactService() {
  const sendContact = (form) => {
    return axiosClient.post("/api/support/contact", form);
  };
  return { sendContact };
}
