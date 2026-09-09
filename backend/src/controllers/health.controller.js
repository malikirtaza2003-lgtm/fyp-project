export function getHealth(_req, res) {
  res.json({
    status: 'ok',
    service: 'backend',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}