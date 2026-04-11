'use strict'

const si = require('systeminformation')

const THRESHOLDS = {
  cpuTemp:  80,   // °C
  gpuTemp:  85,
  ramUsage: 90,   // %
  diskFree: 10,   // % free remaining
}

async function getHealthReport() {
  const [cpu, mem, disk, temp, battery] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.fsSize(),
    si.cpuTemperature().catch(() => ({ main: null })),
    si.battery().catch(() => ({ hasBattery: false })),
  ])

  const diskMain = disk[0] ?? {}

  const alerts = []

  if (temp.main && temp.main > THRESHOLDS.cpuTemp) {
    alerts.push({ type: 'cpu_temp', message: `Temperatura da CPU alta: ${temp.main}°C`, level: 'high' })
  }

  const ramPct = Math.round((mem.used / mem.total) * 100)
  if (ramPct > THRESHOLDS.ramUsage) {
    alerts.push({ type: 'ram', message: `Uso de RAM alto: ${ramPct}%`, level: 'high' })
  }

  if (diskMain.size) {
    const freePct = Math.round(((diskMain.size - diskMain.used) / diskMain.size) * 100)
    if (freePct < THRESHOLDS.diskFree) {
      alerts.push({ type: 'disk', message: `Pouco espaço em disco: ${freePct}% livre`, level: 'medium' })
    }
  }

  if (battery.hasBattery && battery.percent < 15 && !battery.isCharging) {
    alerts.push({ type: 'battery', message: `Bateria baixa: ${battery.percent}%`, level: 'high' })
  }

  return {
    cpu:     Math.round(cpu.currentLoad),
    ram:     ramPct,
    disk:    diskMain.size ? Math.round((diskMain.used / diskMain.size) * 100) : 0,
    diskFreeGb: diskMain.available ? +(diskMain.available / 1e9).toFixed(1) : null,
    cpuTemp: temp.main,
    battery: battery.hasBattery ? { percent: battery.percent, charging: battery.isCharging } : null,
    alerts,
  }
}

async function getTopProcesses(limit = 10) {
  const procs = await si.processes()
  return procs.list
    .sort((a, b) => b.cpu - a.cpu)
    .slice(0, limit)
    .map(({ name, pid, cpu, mem }) => ({ name, pid, cpu: +cpu.toFixed(1), mem: +mem.toFixed(1) }))
}

module.exports = { getHealthReport, getTopProcesses, THRESHOLDS }
