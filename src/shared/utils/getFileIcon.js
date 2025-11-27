export function getFileIcon({ type, name }) {
  if (type === "folder") return "/images/icon/folder.png";
  if (!name) return "/images/icon/word.png";
  const ext = name.split(".").pop().toLowerCase();

  const extMap = {
    png: "png.png",
    jpg: "png.png",
    jpeg: "png.png",
    gif: "png.png",
    mp4: "mp4.png",
    mp3: "mp3.png",
    pdf: "pdf.png",
    doc: "word.png",
    docx: "word.png",
    xls: "xls.png",
    xlsx: "xls.png",
    ppt: "ppt.png",
    pptx: "ppt.png",
    zip: "zip.png",
    rar: "zip.png",
    txt: "txt.png",
    sql: "sql.png",
    html: "html.png",
    fig: "fig.png",
    ico: "png.png",
    psd: "psd.png",
    ai: "ai.png",
    eml: "eml.png",
    cal: "cal.png",
    folder: "file.png",
    sketch: "sketch.png",
    inndd: "inndd.png",
    "3d": "3d.png",
    ae: "ae.png",
    locked: "locked.png",
  };

  return `/images/icon/${extMap[ext] || "word.png"}`;
}
