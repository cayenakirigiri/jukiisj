// Vercel serverless function: GET /api/check?id=123&zone=456
// Looks up a Mobile Legends nickname + region. Returns JSON only (never raw HTML).
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const id = String((req.query && req.query.id) || "");
  const zone = String((req.query && req.query.zone) || "");

  if (!/^\d{5,12}$/.test(id) || !/^\d{3,5}$/.test(zone)) {
    return res.status(400).json({ ok: false, reason: "invalid" });
  }

  try {
    const r = await fetch("https://gopay.co.id/games/v1/order/user-account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({ code: "MOBILE_LEGENDS", data: { userId: id, zoneId: zone } }),
      signal: AbortSignal.timeout(10000),
    });

    if (r.status >= 500 || r.status === 429 || r.status === 403) {
      return res.status(200).json({ ok: false, reason: "unavailable" });
    }

    let body = null;
    try { body = await r.json(); } catch (e) {}
    const data = body && body.data;
    const nick = data && data.username ? String(data.username).replace(/\+/g, " ").trim() : "";

    if (nick) {
      const country = data.countryOrigin ? String(data.countryOrigin).toUpperCase() : "";
      return res.status(200).json({ ok: true, nickname: nick.slice(0, 40), country });
    }
    return res.status(200).json({ ok: false, reason: "not_found" });
  } catch (e) {
    return res.status(200).json({ ok: false, reason: "unavailable" });
  }
};
        
